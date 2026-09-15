# 05 - Categories, Category Attributes và Brands

## Bảng

```text
categories
category_attributes
brands
```

## Public API

```http
GET /api/categories
GET /api/categories/:slug
GET /api/brands
GET /api/brands/:slug
```

Chỉ trả bản ghi:

```text
status = ACTIVE
deleted_at IS NULL
```

## Admin Category API

```http
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

`DELETE` nên là soft delete/ẩn, không xóa cứng khi đã có sản phẩm.

Category hỗ trợ `parent_id`.

Phải tránh:

- parent trỏ chính nó
- tạo vòng lặp category

## Category Attributes

```http
GET    /api/admin/categories/:id/attributes
POST   /api/admin/categories/:id/attributes
PATCH  /api/admin/category-attributes/:id
DELETE /api/admin/category-attributes/:id
```

Mục đích là định nghĩa form specifications theo category.

## Brand API

```http
GET    /api/admin/brands
POST   /api/admin/brands
PATCH  /api/admin/brands/:id
DELETE /api/admin/brands/:id
```

## Slug

Tự tạo slug từ tên nếu client không gửi.

Kiểm tra UNIQUE và xử lý trường hợp trùng.

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
