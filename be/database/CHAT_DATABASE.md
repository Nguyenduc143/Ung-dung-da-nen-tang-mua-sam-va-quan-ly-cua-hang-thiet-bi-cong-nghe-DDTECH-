# Chat CSKH — database v1

Migration: `009_customer_support_chat.sql`. Hai bảng dùng InnoDB, UTF-8, khóa ngoại `BIGINT UNSIGNED` tương thích với `users.id`. ADMIN hiện tại kiêm CSKH; không sửa enum role và không thêm tài khoản mẫu.

## Cài đặt

Trong `be`, chạy `npm run db:chat` để chỉ cài migration chat theo kết nối trong `.env`. `npm run db:procedures` cũng bao gồm migration này. Có thể import SQL trực tiếp bằng MySQL Workbench (hỗ trợ `DELIMITER`).

`CREATE TABLE IF NOT EXISTS` không xóa bảng/dữ liệu. Procedure được tạo lại bằng `DROP PROCEDURE IF EXISTS` + `CREATE PROCEDURE`. Migration này không tự nâng cấp cấu trúc một bảng chat đã tồn tại với schema khác.

## Hai bảng

- `chat_conversations`: khách hàng, admin phụ trách, trạng thái OPEN/CLOSED, mốc đọc của khách/admin, số thứ tự và thời gian tin cuối. Khóa unique trên `open_customer_id` bảo đảm mỗi khách chỉ có một hội thoại OPEN, nhưng giữ được nhiều hội thoại CLOSED.
- `chat_messages`: hội thoại, người gửi, nội dung văn bản tối đa 4.000 ký tự, thời gian, `message_seq` tăng riêng trong mỗi hội thoại và `client_message_id` do ứng dụng tạo. Khóa unique `(conversation_id, sender_id, client_message_id)` chống gửi trùng khi retry.

Mốc đọc là số thứ tự tin đã đọc, không phải ID toàn cục. Chỉ tăng mốc đọc, không cho vượt tin cuối. Số chưa đọc chỉ đếm tin của bên đối diện. `admin_read_seq` thuộc **admin phụ trách**, không phải mốc riêng cho mọi admin xem inbox.

Khóa ngoại dùng RESTRICT để không mất lịch sử khi xóa người dùng/hội thoại. V1 không có procedure xóa tin, chuyển nhân viên, gửi ảnh hoặc mở lại hội thoại CLOSED; khách bắt đầu hội thoại mới và lịch sử cũ vẫn được giữ.

## Procedure và tham số theo thứ tự

| Procedure | Tham số | Kết quả |
| --- | --- | --- |
| `sp_chat_open_conversation` | customer_id | Hội thoại đang mở hoặc mới tạo |
| `sp_chat_list_conversations` | actor_id, status hoặc NULL, limit, offset | Danh sách và result set thứ hai chứa total |
| `sp_chat_get_conversation` | actor_id, conversation_id | Chi tiết và unread_count |
| `sp_chat_list_messages` | actor_id, conversation_id, before_seq hoặc NULL, limit | Tin mới đến cũ; client đảo thứ tự để hiển thị |
| `sp_chat_send_message` | actor_id, conversation_id, client_message_id, content | Tin đã lưu; retry cùng mã/nội dung trả tin cũ |
| `sp_chat_claim_conversation` | admin_id, conversation_id | Nhận hội thoại chưa có người phụ trách; không giành từ admin khác |
| `sp_chat_mark_read` | actor_id, conversation_id, read_seq | Chi tiết sau khi cập nhật mốc đọc |
| `sp_chat_close_conversation` | actor_id, conversation_id | Đóng bởi khách sở hữu hoặc admin phụ trách |
| `sp_chat_assert_access` | actor_id, conversation_id hoặc NULL, OUT role | Helper kiểm tra tài khoản ACTIVE và quyền truy cập |

Limit 1–100, offset không âm. `client_message_id` 1–64 ký tự ASCII chữ/số/`_`/`-` (UUID hợp lệ). Retry cùng mã nhưng nội dung khác bị từ chối. Lỗi nghiệp vụ dùng SQLSTATE `45000`, thông điệp tiền tố `CHAT_`; backend sẽ ánh xạ sang HTTP phù hợp.

## Bắt buộc khi làm backend

**Mọi procedure thay đổi dữ liệu phải chạy trong transaction do caller quản lý, trên cùng một connection.** Procedure không tự COMMIT/ROLLBACK. Row lock trên hội thoại tuần tự hóa gửi tin, nhận phụ trách, đọc và đóng; không gọi các procedure này qua autocommit/pool.query độc lập.

```js
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [result] = await connection.query(
    'CALL sp_chat_send_message(?, ?, ?, ?)',
    [authenticatedUser.id, conversationId, clientMessageId, content],
  );
  await connection.commit();
  // Chỉ phát socket sau khi commit thành công.
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

`actor_id` phải lấy từ JWT/session đã xác thực, **không lấy từ request body của client**. Procedure chỉ kiểm tra account/ownership, không xác thực JWT thay backend. Khách chỉ xem hội thoại của mình. Admin được xem inbox/lịch sử; phải nhận phụ trách trước khi gửi, ghi mốc đọc hoặc đóng. Validate conversation_id bắt buộc ở API; NULL chỉ dùng cho helper kiểm tra tài khoản.

Tất cả procedure dùng `SQL SECURITY INVOKER`, không SQL động/ghép nội dung tin vào câu SQL. Database app account phải có quyền EXECUTE và quyền bảng tương ứng.

## Kiểm thử

`npm run test:chat:db` kiểm tra trực tiếp database `ddtech` cổng 3307. Dùng hai khách và một admin ACTIVE có sẵn, không tạo tài khoản. Khách đầu tiên cần chưa có tin chat. Toàn bộ hội thoại/tin thử nằm trong transaction và được rollback kể cả khi thất bại. Auto-increment có thể có khoảng trống sau rollback, không ảnh hưởng dữ liệu.

Đã chạy đạt 28 kiểm tra ngày 08/10/2026. Chưa triển khai API, socket chat hoặc giao diện admin/mobile trong bước này.
