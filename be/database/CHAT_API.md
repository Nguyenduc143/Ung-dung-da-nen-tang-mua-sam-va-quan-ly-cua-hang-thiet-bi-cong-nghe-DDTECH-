# API chat CSKH — backend v1

Prefix `/api`; tất cả endpoint yêu cầu `Authorization: Bearer <accessToken>`. ADMIN hiện tại kiêm CSKH. Bản này chỉ chat văn bản; chưa có giao diện admin/mobile.

## Endpoint

| Method | Khách hàng | Admin | Body/query |
| --- | --- | --- | --- |
| POST | `/chat/conversations` | — | `{}`: mở hoặc lấy hội thoại OPEN |
| GET | `/chat/conversations` | `/admin/chat/conversations` | `status=OPEN/CLOSED`, `page=1`, `limit=20` |
| GET | `/chat/conversations/:id` | `/admin/chat/conversations/:id` | Chi tiết, mốc đọc, số chưa đọc |
| GET | `/chat/conversations/:id/messages` | `/admin/chat/conversations/:id/messages` | `beforeSeq` tùy chọn, `limit=30` |
| POST | `/chat/conversations/:id/messages` | `/admin/chat/conversations/:id/messages` | `{"clientMessageId":"UUID","content":"Xin chào"}` |
| POST | — | `/admin/chat/conversations/:id/claim` | `{}` |
| PATCH | `/chat/conversations/:id/read` | `/admin/chat/conversations/:id/read` | `{"readSeq":2}` |
| POST | `/chat/conversations/:id/close` | `/admin/chat/conversations/:id/close` | `{}` |

Success HTTP 200: `{success:true,message,data}`. Các trường trả về dùng camelCase. Body/query có trường lạ bị từ chối. Không gửi `actorId`, `senderId` hoặc `customerId`: backend lấy danh tính từ JWT.

Danh sách hội thoại: `data.conversations` và `data.pagination` (`page`, `limit`, `total`, `totalPages`).

Lịch sử: `data.messages` sắp xếp `messageSeq` giảm dần, `data.pagination` gồm `limit`, `hasMore`, `nextBeforeSeq`. Client đảo thứ tự để hiển thị và dùng `nextBeforeSeq` tải tin cũ. Limit tối đa 100.

Gửi tin: `data.message` và `data.duplicate`. Retry phải dùng **cùng clientMessageId và cùng nội dung**. Tin mới có `duplicate:false`; retry trả cùng ID với `duplicate:true`, không phát thêm sự kiện tin mới. Mã dài 1–64 ký tự ASCII chữ/số/`_`/`-`; UUID phù hợp. Nội dung tối đa 4.000 Unicode code points, bỏ khoảng trắng hai đầu.

Admin phải claim trước khi gửi/đánh dấu đọc/đóng. Hai admin cùng claim: một thành công, bên còn lại HTTP 409. Admin khác vẫn được xem inbox/lịch sử nhưng không can thiệp hội thoại đã có người phụ trách. Khách chỉ xem hội thoại của mình. Hội thoại đóng không nhận tin mới; retry tin đã lưu vẫn được trả lại. Khách mở cuộc trò chuyện mới, lịch sử cũ vẫn còn.

HTTP lỗi: 401 chưa đăng nhập/phiên thu hồi; 403 sai vai trò/chưa phụ trách; 404 hội thoại không tồn tại hoặc không thuộc khách; 409 đã đóng/đã nhận/mã tin trùng nội dung khác; 422 dữ liệu sai; 429 gửi quá nhanh; 503 database bận sau retry deadlock. Limit gửi tin dùng middleware hiện tại, 60 request/phút theo IP, chung hai nhóm route. Dùng nhiều backend instance cần chuyển rate-limit sang kho dùng chung.

## Socket

Kết nối socket hiện tại bằng `auth: {token: accessToken}`. Không cần tự join hội thoại; server dùng room `user:<customerId>` và `role:ADMIN` sau xác thực. Không có thao tác gửi tin qua socket: dùng HTTP.

- `chat:message-created`: metadata hội thoại và `message` vừa commit.
- `chat:conversation-updated`: mở/nhận phụ trách.
- `chat:read`: mốc đọc và `readerId`.
- `chat:conversation-closed`: hội thoại đã đóng.

Metadata chung: `conversationId`, `customerId`, `assignedAdminId`, `status`, `lastMessageSeq`, `customerReadSeq`, `adminReadSeq`. Không phát `unreadCount` vì nó khác theo người xem; refetch API hoặc tự tính đúng bên gửi.

Chỉ phát sau COMMIT. Server kiểm tra lại account ACTIVE, role, auth_version và hạn token trước khi phát chat; socket phiên hết hiệu lực bị disconnect. Socket không thay thế database: reconnect phải refresh danh sách/lịch sử và mốc đọc. Client merge theo message ID, sắp xếp theo messageSeq, không dựa vào thứ tự sự kiện đến. Chưa có outbox đảm bảo delivery khi process dừng giữa commit và emit; tin đã lưu vẫn lấy lại qua API.

## Cài và kiểm thử

```powershell
cd be
npm run db:chat
npm run test:chat
npm run test:chat:db
npm run build
```

Procedure gửi tin đã bổ sung `is_new` và locking read để xử lý hai request retry đồng thời với isolation mặc định MySQL. Services retry tối đa ba transaction khi deadlock; mọi socket side effect nằm ngoài transaction.

Test HTTP/socket mở server ở cổng ngẫu nhiên, tạo bốn tài khoản test có email `example.invalid`, kiểm tra concurrency/phân quyền/thu hồi socket, rồi xóa **chỉ** dữ liệu thuộc các tài khoản đó. Dữ liệu thật không bị xóa. Khi chạy thực tế bằng `npm start` (dist), cần build và khởi động lại tiến trình backend; chế độ dev watcher thường tự tải lại.
