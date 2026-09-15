# 04 - User Profile và Addresses

## Bảng liên quan

```text
users
addresses
```

## User API

```http
GET   /api/users/me
PATCH /api/users/me
PATCH /api/users/me/password
```

Cho phép user sửa:

- full_name
- phone
- avatar_url
- gender
- date_of_birth

Không cho user tự sửa:

- role
- status
- deleted_at
- password_hash

## Address API

```http
GET    /api/addresses
POST   /api/addresses
PATCH  /api/addresses/:id
DELETE /api/addresses/:id
PATCH  /api/addresses/:id/default
```

## Quy tắc

- User chỉ được thao tác address thuộc chính họ.
- Một user có thể có nhiều address.
- Khi đặt `is_default = 1`, các address khác của user phải về `0`.
- Việc đổi default address nên dùng transaction.
- Không dùng địa chỉ hiện tại của bảng `addresses` để hiển thị lịch sử order; order đã có snapshot riêng.

## Admin User API

```http
GET   /api/admin/users
GET   /api/admin/users/:id
PATCH /api/admin/users/:id/status
```

Cho phép admin khóa/mở:

```text
ACTIVE <-> LOCKED
```

Không xóa cứng user đã có order.

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
