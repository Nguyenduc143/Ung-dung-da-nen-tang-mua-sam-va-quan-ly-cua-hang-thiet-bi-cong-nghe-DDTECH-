# 02 - Kết nối MySQL 8

## Database

Database hiện có tên:

```text
ddtech
```

Sử dụng `mysql2/promise`.

## Yêu cầu

Tạo:

```text
src/config/database.ts
src/config/env.ts
```

## Connection Pool

Phải dùng pool, không tạo connection mới thủ công cho từng request.

Cấu hình phù hợp local development:

- `waitForConnections: true`
- giới hạn connection hợp lý
- `queueLimit`
- charset UTF-8 phù hợp

## Helper transaction

Tạo helper để service có thể viết nghiệp vụ:

```text
BEGIN
...
COMMIT
```

và nếu lỗi:

```text
ROLLBACK
```

Connection phải được `release()` trong `finally`.

## Test

Tạo một hàm kiểm tra:

```sql
SELECT 1;
```

và kiểm tra database khi server khởi động.

Nếu MySQL không kết nối được, log lỗi rõ ràng và dừng server.

## Không làm

- Không hard-code password DB vào source.
- Không dùng root/password thật trong Git.
- Không nối string SQL trực tiếp từ input người dùng.
- Luôn parameterized query với `?`.

> **Nguyên tắc chung**
>
> - Backend: Node.js + Express + TypeScript.
> - Database: MySQL 8, database `ddtech`.
> - Truy vấn bằng `mysql2/promise`; không dùng ORM trừ khi tôi yêu cầu.
> - Authentication: JWT access token + refresh token.
> - Password: bcrypt.
> - Realtime: Socket.io.
> - Response API thống nhất: `{ success, message, data, errors? }`.
> - Không thay đổi tên bảng/cột trong database hiện tại nếu chưa thật sự cần thiết.
> - Mọi input từ client phải validate ở backend.
> - Không tin `price`, `role`, `stock`, `total_amount`, `payment_status` do client gửi lên.
> - Các nghiệp vụ nhiều bước như checkout, đổi tồn kho, áp voucher, thanh toán phải dùng transaction.
> - Viết code tách `routes -> controller -> service -> repository/query` rõ ràng.
> - Có middleware xử lý lỗi tập trung.
> - Code phải chạy được, không viết pseudo-code.
