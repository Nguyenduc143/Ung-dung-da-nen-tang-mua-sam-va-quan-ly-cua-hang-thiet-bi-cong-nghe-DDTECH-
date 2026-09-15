# 11 - Reviews

## Bảng

```text
reviews
orders
order_items
products
```

## Customer API

```http
GET    /api/products/:id/reviews
POST   /api/products/:id/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
```

## Quy tắc

- User chỉ review bằng tài khoản của họ.
- Một user chỉ review một product một lần theo UNIQUE hiện tại.
- Rating từ 1 đến 5.
- Nếu yêu cầu verified purchase:
  - tìm order `DELIVERED`
  - order thuộc user
  - order_items có product đó
- khi hợp lệ:
  - `is_verified_purchase = 1`
  - lưu `order_id`

## Product rating

Sau CREATE/UPDATE/DELETE/HIDE review, cập nhật lại:

```text
products.rating_avg
products.review_count
```

Nên tính từ review `APPROVED`.

## Admin API

```http
GET   /api/admin/reviews
PATCH /api/admin/reviews/:id/status
POST  /api/admin/reviews/:id/reply
```

Status:

```text
PENDING
APPROVED
HIDDEN
```

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
