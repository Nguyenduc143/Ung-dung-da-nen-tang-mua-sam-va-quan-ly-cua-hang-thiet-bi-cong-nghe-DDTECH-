# 03 - Authentication JWT

## Bảng liên quan

```text
users
refresh_tokens
```

## Chức năng

### Đăng ký

```http
POST /api/auth/register
```

Input:

```json
{
  "fullName": "Nguyen Van A",
  "email": "a@gmail.com",
  "phone": "0123456789",
  "password": "12345678"
}
```

Yêu cầu:

- validate email
- password tối thiểu 8 ký tự
- kiểm tra email/phone tồn tại
- bcrypt hash password
- mặc định `role = CUSTOMER`
- client không được tự đặt role ADMIN

### Đăng nhập

```http
POST /api/auth/login
```

- kiểm tra user tồn tại
- `status = ACTIVE`
- `deleted_at IS NULL`
- bcrypt compare
- cập nhật `last_login_at`
- trả access token và refresh token
- refresh token gốc chỉ trả client; DB lưu SHA-256 hash vào `refresh_tokens`

### Refresh token

```http
POST /api/auth/refresh-token
```

- verify JWT refresh
- hash token rồi tìm trong DB
- token chưa revoked
- chưa hết hạn
- user còn ACTIVE
- rotate refresh token nếu có thể

### Logout

```http
POST /api/auth/logout
```

- revoke refresh token hiện tại

### Logout all devices

```http
POST /api/auth/logout-all
```

- revoke toàn bộ refresh token của user

### Current user

```http
GET /api/auth/me
```

## Middleware

Tạo:

```text
auth.middleware.ts
admin.middleware.ts
```

`auth.middleware` đọc:

```text
Authorization: Bearer <access_token>
```

`admin.middleware` yêu cầu:

```text
role === "ADMIN"
```

## Security

JWT payload chỉ nên chứa:

```json
{
  "sub": 1,
  "role": "CUSTOMER"
}
```

Không nhét password hoặc dữ liệu nhạy cảm vào JWT.

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
