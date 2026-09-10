# 13 - Inventory Management

## Bảng

```text
products
product_variants
inventory_transactions
```

## Admin API

```http
GET  /api/admin/inventory
GET  /api/admin/inventory/transactions
POST /api/admin/inventory/adjust
POST /api/admin/inventory/import
```

## Quy tắc

Không cho admin sửa stock tùy tiện mà không lưu lịch sử.

Mỗi thay đổi stock phải:

1. transaction
2. lock product/variant
3. tính stock mới
4. không cho stock âm
5. update stock
6. insert inventory_transactions
7. commit

## Type

```text
IMPORT
SALE
RETURN
ADJUSTMENT
CANCEL_ORDER
```

`quantity`:

- dương = tăng kho
- âm = giảm kho

## Product có variant

Nếu có variant:

- thay đổi stock variant
- sau đó đồng bộ `products.stock = SUM(product_variants.stock)`

## Low stock

Admin dashboard cần API:

```http
GET /api/admin/inventory/low-stock?threshold=5
```

## Concurrency

Checkout và nhập/xuất kho phải dùng `SELECT ... FOR UPDATE` để tránh overselling.

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
