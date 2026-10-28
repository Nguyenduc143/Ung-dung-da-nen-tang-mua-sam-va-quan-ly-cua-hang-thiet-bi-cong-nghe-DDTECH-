-- CHAT CHĂM SÓC KHÁCH HÀNG: tài khoản ADMIN kiêm nhân viên CSKH.
-- Quan hệ dữ liệu: users -> chat_conversations -> chat_messages.
-- Backend lấy ID người thao tác từ JWT đã xác thực, không tin ID do client gửi.
-- Với procedure thay đổi dữ liệu, backend phải mở transaction trên CÙNG connection:
-- beginTransaction -> CALL procedure -> commit; nếu có lỗi thì rollback.
-- Chỉ phát sự kiện Socket sau khi commit thành công.
-- SQL SECURITY INVOKER dùng quyền của tài khoản kết nối MySQL, không thay thế xác thực JWT.
-- DROP PROCEDURE bên dưới chỉ tạo lại procedure, không xóa bảng hoặc lịch sử chat.
-- Đổi dấu kết thúc lệnh để dấu chấm phẩy bên trong procedure không kết thúc cả procedure.
DELIMITER $$

-- ==========================================================================
-- 1. BẢNG HỘI THOẠI: lưu khách hàng, nhân viên phụ trách và trạng thái xử lý.
-- ==========================================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  -- NULL: chưa có nhân viên nhận hỗ trợ. OPEN: đang mở; CLOSED: đã kết thúc.
  assigned_admin_id BIGINT UNSIGNED NULL,
  status ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  -- Cột tự tính: chỉ mang customer_id khi OPEN; khi CLOSED là NULL.
  -- Kết hợp UNIQUE bên dưới: mỗi khách chỉ có một hội thoại mở,
  -- nhưng có thể có nhiều hội thoại đã đóng (UNIQUE cho phép nhiều giá trị NULL).
  open_customer_id BIGINT UNSIGNED GENERATED ALWAYS AS
    (CASE WHEN status = 'OPEN' THEN customer_id ELSE NULL END) STORED,
  -- Số thứ tự tin nhắn cuối trong hội thoại; không phải ID tin nhắn toàn hệ thống.
  last_message_seq BIGINT UNSIGNED NOT NULL DEFAULT 0,
  -- Mốc tin đã đọc của khách và nhân viên phụ trách; 0 nghĩa là chưa đọc tin nào.
  -- admin_read_seq dùng chung cho nhân viên phụ trách, không lưu riêng cho từng admin.
  customer_read_seq BIGINT UNSIGNED NOT NULL DEFAULT 0,
  admin_read_seq BIGINT UNSIGNED NOT NULL DEFAULT 0,
  -- Thời gian có độ chính xác mili giây; chưa có tin/ chưa đóng thì để NULL.
  last_message_at DATETIME(3) NULL,
  closed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_chat_open_customer (open_customer_id),
  -- Các index hỗ trợ tra lịch sử khách, danh sách hội thoại và danh sách phụ trách.
  KEY idx_chat_customer (customer_id, id),
  KEY idx_chat_inbox (status, last_message_at, id),
  KEY idx_chat_assignee (assigned_admin_id, status, last_message_at, id),
  -- RESTRICT ngăn xóa/sửa ID người dùng đang được tham chiếu, giữ lịch sử liên kết.
  CONSTRAINT fk_chat_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_chat_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  -- Không được đọc vượt tin cuối; hội thoại đóng bắt buộc có thời điểm đóng.
  CONSTRAINT chk_chat_read_seq CHECK (customer_read_seq <= last_message_seq AND admin_read_seq <= last_message_seq),
  CONSTRAINT chk_chat_closed_at CHECK ((status = 'OPEN' AND closed_at IS NULL) OR (status = 'CLOSED' AND closed_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

-- ==========================================================================
-- 2. BẢNG TIN NHẮN: mỗi tin thuộc một hội thoại và một người gửi.
-- ==========================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  -- Thứ tự tăng từ 1 trong từng hội thoại, dùng phân trang và đánh dấu đã đọc.
  message_seq BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  -- Mã do client tạo để thử gửi lại khi mất mạng mà không tạo tin trùng.
  -- ascii_bin phân biệt chữ hoa/thường; mã này không phải thông tin xác thực.
  client_message_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- Không trùng thứ tự trong hội thoại; không trùng mã gửi lại của cùng người gửi.
  UNIQUE KEY uq_chat_message_seq (conversation_id, message_seq),
  UNIQUE KEY uq_chat_client_message (conversation_id, sender_id, client_message_id),
  KEY idx_chat_sender (sender_id),
  -- Không xóa cứng hội thoại/người dùng khi còn tin nhắn tham chiếu đến.
  CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_chat_message_seq CHECK (message_seq > 0),
  -- Nội dung sau khi bỏ khoảng trắng hai đầu phải có 1-4000 ký tự (không đếm byte).
  CONSTRAINT chk_chat_content CHECK (CHAR_LENGTH(TRIM(content)) BETWEEN 1 AND 4000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

-- ==========================================================================
-- 3. KIỂM TRA QUYỀN: procedure dùng chung cho các thao tác chat.
-- p_actor_id: người thao tác; p_conversation_id: hội thoại (NULL nếu chỉ kiểm tra tài khoản).
-- p_role: tham số OUT trả về vai trò. ADMIN xem được mọi hội thoại; khách chỉ xem của mình.
-- SIGNAL SQLSTATE '45000' trả lỗi nghiệp vụ để backend chuyển thành phản hồi HTTP.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_assert_access$$
CREATE PROCEDURE sp_chat_assert_access(IN p_actor_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED, OUT p_role VARCHAR(16))
SQL SECURITY INVOKER
BEGIN
  SET p_role = NULL;
  -- Chỉ chấp nhận tài khoản đang hoạt động và chưa bị xóa mềm.
  SELECT role INTO p_role FROM users WHERE id = p_actor_id AND status = 'ACTIVE' AND deleted_at IS NULL;
  IF p_role IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_UNAUTHORIZED'; END IF;
  -- Gộp lỗi không tồn tại/không có quyền, tránh tiết lộ hội thoại của người khác.
  IF p_conversation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM chat_conversations WHERE id = p_conversation_id AND (p_role = 'ADMIN' OR customer_id = p_actor_id)
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_NOT_FOUND_OR_FORBIDDEN'; END IF;
END$$

-- ==========================================================================
-- 4. CHI TIẾT HỘI THOẠI: trả thông tin khách, nhân viên và số tin chưa đọc.
-- unread_count chỉ đếm tin của phía đối diện sau mốc đã đọc, không đếm tin tự gửi.
-- LEFT JOIN vẫn trả hội thoại khi chưa có nhân viên phụ trách.
-- FOR SHARE đọc bản ghi hiện tại và giữ khóa chia sẻ đến khi transaction kết thúc.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_get_conversation$$
CREATE PROCEDURE sp_chat_get_conversation(IN p_actor_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  CALL sp_chat_assert_access(p_actor_id, p_conversation_id, v_role);
  SELECT c.*, u.full_name AS customer_name, u.avatar_url AS customer_avatar_url,
    a.full_name AS assigned_admin_name,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id
      AND m.message_seq > IF(v_role = 'CUSTOMER', c.customer_read_seq, c.admin_read_seq)
      AND IF(v_role = 'CUSTOMER', m.sender_id <> c.customer_id, m.sender_id = c.customer_id)) AS unread_count
  FROM chat_conversations c JOIN users u ON u.id = c.customer_id
  LEFT JOIN users a ON a.id = c.assigned_admin_id WHERE c.id = p_conversation_id FOR SHARE;
END$$

-- ==========================================================================
-- 5. MỞ HỘI THOẠI: chỉ CUSTOMER được gọi; tái sử dụng hội thoại đang mở nếu có.
-- Nếu các hội thoại cũ đã đóng, tạo hội thoại mới và giữ nguyên lịch sử cũ.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_open_conversation$$
CREATE PROCEDURE sp_chat_open_conversation(IN p_customer_id BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  DECLARE v_id BIGINT UNSIGNED;
  CALL sp_chat_assert_access(p_customer_id, NULL, v_role);
  IF v_role <> 'CUSTOMER' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_CUSTOMER_REQUIRED'; END IF;
  -- UNIQUE open_customer_id ngăn tạo hai hội thoại mở, kể cả khi gọi đồng thời.
  -- Khi trùng, LAST_INSERT_ID(id) lấy ID hội thoại có sẵn thay vì tạo bản ghi mới.
  INSERT INTO chat_conversations (customer_id) VALUES (p_customer_id)
  ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
  SET v_id = LAST_INSERT_ID();
  CALL sp_chat_get_conversation(p_customer_id, v_id);
END$$

-- ==========================================================================
-- 6. DANH SÁCH HỘI THOẠI: lọc trạng thái và phân trang cho khách/admin.
-- p_status NULL: mọi trạng thái; p_limit: số dòng; p_offset: số dòng bỏ qua.
-- Trả HAI tập kết quả: danh sách của trang và tổng số hội thoại phù hợp.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_list_conversations$$
CREATE PROCEDURE sp_chat_list_conversations(IN p_actor_id BIGINT UNSIGNED, IN p_status VARCHAR(16), IN p_limit INT, IN p_offset INT)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  CALL sp_chat_assert_access(p_actor_id, NULL, v_role);
  -- Chặn phân trang không hợp lệ; mỗi lần lấy tối đa 100 hội thoại.
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset < 0
    OR (p_status IS NOT NULL AND p_status NOT IN ('OPEN','CLOSED'))
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_INVALID_PAGINATION_OR_STATUS'; END IF;
  -- Tập kết quả 1: thông tin hội thoại và số tin từ phía đối diện chưa đọc.
  SELECT c.*, u.full_name AS customer_name, u.avatar_url AS customer_avatar_url,
    a.full_name AS assigned_admin_name,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id
      AND m.message_seq > IF(v_role = 'CUSTOMER', c.customer_read_seq, c.admin_read_seq)
      AND IF(v_role = 'CUSTOMER', m.sender_id <> c.customer_id, m.sender_id = c.customer_id)) AS unread_count
  FROM chat_conversations c JOIN users u ON u.id = c.customer_id
  LEFT JOIN users a ON a.id = c.assigned_admin_id
  WHERE (v_role = 'ADMIN' OR c.customer_id = p_actor_id) AND (p_status IS NULL OR c.status = p_status)
  -- Ưu tiên hội thoại có hoạt động mới nhất; chưa có tin thì dùng ngày tạo.
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC LIMIT p_limit OFFSET p_offset;
  -- Tập kết quả 2: tổng số dòng trước phân trang, dùng tính tổng trang trên giao diện.
  SELECT COUNT(*) AS total FROM chat_conversations c
  WHERE (v_role = 'ADMIN' OR c.customer_id = p_actor_id) AND (p_status IS NULL OR c.status = p_status);
END$$

-- ==========================================================================
-- 7. LỊCH SỬ TIN NHẮN: phân trang theo số thứ tự, không dùng OFFSET.
-- p_before_seq NULL: lấy các tin mới nhất; có giá trị: lấy tin cũ hơn mốc đó.
-- Kết quả trả mới -> cũ (DESC); giao diện sắp xếp/hiển thị theo bố cục chat.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_list_messages$$
CREATE PROCEDURE sp_chat_list_messages(IN p_actor_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED, IN p_before_seq BIGINT UNSIGNED, IN p_limit INT)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  CALL sp_chat_assert_access(p_actor_id, p_conversation_id, v_role);
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_INVALID_LIMIT'; END IF;
  SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar_url
  FROM chat_messages m JOIN users u ON u.id = m.sender_id
  WHERE m.conversation_id = p_conversation_id AND (p_before_seq IS NULL OR m.message_seq < p_before_seq)
  ORDER BY m.message_seq DESC LIMIT p_limit;
END$$

-- ==========================================================================
-- 8. GỬI TIN NHẮN: kiểm tra quyền, chống gửi trùng và cập nhật tin cuối.
-- p_client_message_id phải được giữ nguyên khi client thử gửi lại cùng một tin.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_send_message$$
CREATE PROCEDURE sp_chat_send_message(IN p_actor_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED, IN p_client_message_id VARCHAR(64), IN p_content TEXT)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  DECLARE v_status VARCHAR(16);
  DECLARE v_admin BIGINT UNSIGNED;
  DECLARE v_seq BIGINT UNSIGNED;
  DECLARE v_existing BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_content TEXT;
  DECLARE v_is_new TINYINT DEFAULT 0;
  CALL sp_chat_assert_access(p_actor_id, p_conversation_id, v_role);
  -- Nội dung 1-4000 ký tự; mã gửi gồm chữ, số, dấu gạch dưới/gạch ngang, dài 1-64.
  IF p_content IS NULL OR CHAR_LENGTH(TRIM(p_content)) NOT BETWEEN 1 AND 4000
    OR p_client_message_id IS NULL OR p_client_message_id NOT REGEXP '^[A-Za-z0-9_-]{1,64}$'
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_INVALID_MESSAGE'; END IF;
  -- Khóa hội thoại để các lần gửi đồng thời không lấy cùng một số thứ tự mới.
  SELECT status, assigned_admin_id, last_message_seq INTO v_status, v_admin, v_seq
    FROM chat_conversations WHERE id = p_conversation_id FOR UPDATE;
  -- Nhân viên phải nhận phụ trách trước khi trả lời; khách không cần bước nhận này.
  IF v_role = 'ADMIN' AND (v_admin IS NULL OR v_admin <> p_actor_id)
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_CLAIM_REQUIRED'; END IF;
  -- Đọc có khóa để thấy bản ghi hiện tại, kể cả tin được tạo bởi lần gửi đồng thời.
  SELECT id, content INTO v_existing, v_content FROM chat_messages
    WHERE conversation_id = p_conversation_id AND sender_id = p_actor_id AND client_message_id = p_client_message_id FOR UPDATE;
  IF v_existing IS NOT NULL THEN
    -- Mã cũ + nội dung giống hệt (sau TRIM): trả lại tin cũ, không chèn thêm.
    -- BINARY so sánh chính xác, phân biệt hoa/thường; đổi nội dung với cùng mã là lỗi.
    -- Nhánh này cho phép thử lại tin đã lưu ngay cả khi hội thoại vừa được đóng.
    IF BINARY v_content <> BINARY TRIM(p_content) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_IDEMPOTENCY_CONFLICT'; END IF;
  ELSE
    -- Chỉ tin mới yêu cầu hội thoại OPEN; cấp số thứ tự tiếp theo và lưu nội dung.
    IF v_status <> 'OPEN' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_CONVERSATION_CLOSED'; END IF;
    INSERT INTO chat_messages (conversation_id, message_seq, sender_id, client_message_id, content)
      VALUES (p_conversation_id, v_seq + 1, p_actor_id, p_client_message_id, TRIM(p_content));
    SET v_existing = LAST_INSERT_ID();
    SET v_is_new = 1;
    -- Cập nhật thông tin phục vụ sắp xếp inbox; gửi tin không tự đánh dấu đã đọc.
    UPDATE chat_conversations SET last_message_seq = v_seq + 1, last_message_at = CURRENT_TIMESTAMP(3)
      WHERE id = p_conversation_id;
  END IF;
  -- is_new = 1: vừa tạo; = 0: gửi lại tin cũ. Backend dùng cờ này tránh phát Socket trùng.
  SELECT m.*, v_is_new AS is_new FROM chat_messages m WHERE id = v_existing FOR SHARE;
END$$

-- ==========================================================================
-- 9. NHẬN PHỤ TRÁCH: chỉ ADMIN nhận được hội thoại OPEN chưa có người khác nhận.
-- Khóa hội thoại tránh hai nhân viên nhận cùng lúc; nhận lại của mình vẫn hợp lệ.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_claim_conversation$$
CREATE PROCEDURE sp_chat_claim_conversation(IN p_admin_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  DECLARE v_status VARCHAR(16);
  DECLARE v_admin BIGINT UNSIGNED;
  CALL sp_chat_assert_access(p_admin_id, p_conversation_id, v_role);
  IF v_role <> 'ADMIN' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_ADMIN_REQUIRED'; END IF;
  SELECT status, assigned_admin_id INTO v_status, v_admin FROM chat_conversations WHERE id = p_conversation_id FOR UPDATE;
  IF v_status <> 'OPEN' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_CONVERSATION_CLOSED'; END IF;
  IF v_admin IS NOT NULL AND v_admin <> p_admin_id THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_ALREADY_ASSIGNED'; END IF;
  UPDATE chat_conversations SET assigned_admin_id = p_admin_id WHERE id = p_conversation_id;
  CALL sp_chat_get_conversation(p_admin_id, p_conversation_id);
END$$

-- ==========================================================================
-- 10. ĐÁNH DẤU ĐÃ ĐỌC: p_read_seq là số thứ tự tin cuối người dùng đã đọc.
-- Khách cập nhật mốc của mình; chỉ nhân viên phụ trách cập nhật mốc phía admin.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_mark_read$$
CREATE PROCEDURE sp_chat_mark_read(IN p_actor_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED, IN p_read_seq BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  DECLARE v_seq BIGINT UNSIGNED;
  DECLARE v_admin BIGINT UNSIGNED;
  CALL sp_chat_assert_access(p_actor_id, p_conversation_id, v_role);
  -- Khóa hội thoại để kiểm tra mốc đọc với số thứ tự tin cuối hiện tại.
  SELECT last_message_seq, assigned_admin_id INTO v_seq, v_admin FROM chat_conversations WHERE id = p_conversation_id FOR UPDATE;
  IF p_read_seq IS NULL OR p_read_seq > v_seq THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_INVALID_READ_SEQ'; END IF;
  IF v_role = 'CUSTOMER' THEN
    -- GREATEST không cho mốc đã đọc lùi lại khi các yêu cầu đến không đúng thứ tự.
    UPDATE chat_conversations SET customer_read_seq = GREATEST(customer_read_seq, p_read_seq) WHERE id = p_conversation_id;
  ELSE
    -- Admin khác có thể xem lịch sử nhưng không cập nhật mốc đọc của người phụ trách.
    IF v_admin IS NULL OR v_admin <> p_actor_id THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_CLAIM_REQUIRED'; END IF;
    UPDATE chat_conversations SET admin_read_seq = GREATEST(admin_read_seq, p_read_seq) WHERE id = p_conversation_id;
  END IF;
  CALL sp_chat_get_conversation(p_actor_id, p_conversation_id);
END$$

-- ==========================================================================
-- 11. KẾT THÚC HỘI THOẠI: khách sở hữu hoặc nhân viên phụ trách được đóng.
-- Không xóa tin nhắn; open_customer_id tự thành NULL để khách có thể mở cuộc chat mới.
-- ==========================================================================
DROP PROCEDURE IF EXISTS sp_chat_close_conversation$$
CREATE PROCEDURE sp_chat_close_conversation(IN p_actor_id BIGINT UNSIGNED, IN p_conversation_id BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_role VARCHAR(16);
  DECLARE v_admin BIGINT UNSIGNED;
  CALL sp_chat_assert_access(p_actor_id, p_conversation_id, v_role);
  SELECT assigned_admin_id INTO v_admin FROM chat_conversations WHERE id = p_conversation_id FOR UPDATE;
  IF v_role = 'ADMIN' AND (v_admin IS NULL OR v_admin <> p_actor_id)
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CHAT_CLAIM_REQUIRED'; END IF;
  -- COALESCE giữ thời điểm đóng đầu tiên nếu yêu cầu đóng được gửi lại.
  UPDATE chat_conversations SET status = 'CLOSED', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP(3)) WHERE id = p_conversation_id;
  CALL sp_chat_get_conversation(p_actor_id, p_conversation_id);
END$$

-- Khôi phục dấu chấm phẩy làm dấu kết thúc lệnh SQL thông thường.
DELIMITER ;
