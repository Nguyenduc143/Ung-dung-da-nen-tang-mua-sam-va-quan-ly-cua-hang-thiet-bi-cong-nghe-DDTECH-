# 10 - Promotions

## Bảng

```text
promotions
promotion_usages
orders
```

## Public API

```http
POST /api/promotions/validate
```

Input:

```json
{
  "code": "DDTECH10"
}
```

Phải kiểm tra:

- ACTIVE
- current time nằm giữa start_date/end_date
- subtotal >= min_order_value
- usage_limit chưa vượt
- usage_limit_per_user chưa vượt

## Discount

### PERCENT

```text
discount = subtotal * discount_value / 100
```

Nếu có `max_discount` thì giới hạn.

### FIXED

```text
discount = discount_value
```

Không để total âm.

## Admin API

```http
GET    /api/admin/promotions
POST   /api/admin/promotions
PATCH  /api/admin/promotions/:id
DELETE /api/admin/promotions/:id
```

Nên chuyển status INACTIVE thay vì xóa promotion đã được dùng.

## Checkout

Việc validate cuối cùng phải nằm trong transaction checkout, không dựa vào kết quả validate trước đó ở mobile.

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
