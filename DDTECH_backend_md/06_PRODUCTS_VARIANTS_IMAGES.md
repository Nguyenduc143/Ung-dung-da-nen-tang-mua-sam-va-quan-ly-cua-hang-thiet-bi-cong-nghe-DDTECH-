# 06 - Products, Variants và Images

## Bảng

```text
products
product_variants
product_images
category_attributes
brands
categories
```

## Public API

```http
GET /api/products
GET /api/products/:id
GET /api/products/slug/:slug
```

## Filter / Search

`GET /api/products` hỗ trợ:

```text
search
category
brand
minPrice
maxPrice
sort
featured
new
page
limit
```

Sort:

```text
price_asc
price_desc
newest
best_selling
rating
```

Chỉ hiển thị:

```text
products.status = ACTIVE
products.deleted_at IS NULL
```

## Product detail

Trả:

- product
- category
- brand
- specifications
- variants
- images
- rating_avg
- review_count
- stock

## Admin CRUD

```http
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
```

DELETE là soft delete.

## Variant API

```http
POST   /api/admin/products/:id/variants
PATCH  /api/admin/variants/:id
DELETE /api/admin/variants/:id
```

Luôn xác minh variant thuộc đúng product.

Nếu `has_variants = 1`:

- stock thực tế nằm ở variants
- `products.stock` phải đồng bộ thành tổng variant stock
- giá hiển thị sản phẩm có thể lấy giá nhỏ nhất của variant

## Product Images

```http
POST   /api/admin/products/:id/images
DELETE /api/admin/product-images/:id
PATCH  /api/admin/product-images/:id/primary
```

Backend đảm bảo mỗi product chỉ có một ảnh `is_primary = 1`.

## Validation

- `price >= 0`
- `sale_price <= price`
- stock không âm
- SKU unique
- slug unique
- không tin price/stock từ Mobile trong quá trình checkout; checkout phải đọc lại DB.

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
