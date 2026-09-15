# 16 - Testing và API Documentation

## Test mức tối thiểu

### Auth

- register thành công
- email duplicate
- login đúng/sai password
- account LOCKED
- access token
- refresh token
- logout

### Product

- list/filter/search
- product detail
- admin create/update
- SKU duplicate
- sale_price > price

### Cart

- add item
- duplicate item cộng quantity
- variant không thuộc product
- remove item

### Order

- checkout thành công
- hết stock
- concurrent order không làm stock âm
- snapshot giá
- cancel hoàn stock
- user không xem order người khác
- status transition sai

### Promotion

- hết hạn
- chưa tới ngày
- vượt usage limit
- min order
- percent max discount

### Review

- rating invalid
- duplicate review
- verified purchase

### Admin

- customer gọi route admin phải nhận 403

## Công cụ

Có thể dùng:

- Vitest hoặc Jest
- Supertest

## API docs

Tạo:

```text
backend/API.md
```

Cho mỗi endpoint ghi:

- method
- URL
- auth requirement
- body/query
- response mẫu
- error có thể xảy ra

## Postman

Nếu có thể, tạo Postman collection theo group:

```text
Auth
Users
Products
Cart
Orders
Payments
Promotions
Reviews
Notifications
Admin
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
