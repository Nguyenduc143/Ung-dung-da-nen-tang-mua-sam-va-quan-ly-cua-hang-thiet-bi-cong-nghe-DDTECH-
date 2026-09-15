# 15 - Security, Validation và Error Handling

## Middleware bắt buộc

```text
error.middleware.ts
notFound.middleware.ts
auth.middleware.ts
admin.middleware.ts
rateLimit.middleware.ts
```

## Validation

Dùng Zod.

Tạo schema cho:

- register
- login
- update profile
- create/update product
- cart
- checkout
- promotion
- review
- admin order status

## HTTP status

Dùng nhất quán:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

## API Response

Thành công:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {}
}
```

Lỗi:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": []
}
```

## Security checklist

- helmet
- CORS whitelist
- password bcrypt
- refresh token hash trong DB
- parameterized SQL
- không log password/token
- không trả `password_hash`
- role check ở backend
- ownership check cho order/address/review
- validate pagination limit
- chống mass assignment
- rate limit login/refresh
- env secret không commit Git
- production không trả stack trace

## MySQL

Không xây SQL bằng nối chuỗi từ input.

Luôn dùng placeholder.

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
