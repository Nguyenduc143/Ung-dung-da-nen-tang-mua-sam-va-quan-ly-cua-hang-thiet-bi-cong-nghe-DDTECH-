# 08 - Product Variants và Images

## Variant API
```http
POST   /api/admin/products/:id/variants
PATCH  /api/admin/variants/:id
DELETE /api/admin/variants/:id
```

Variant fields:
- sku
- variant_name
- attributes
- price
- sale_price
- stock
- image_url
- sort_order
- status

Nếu `has_variants = 1`, UI hiển thị bảng variants và stock tổng từ backend.

## Images API
```http
POST   /api/admin/products/:id/images
DELETE /api/admin/product-images/:id
PATCH  /api/admin/product-images/:id/primary
```

UI:
- preview grid
- badge ảnh chính
- set primary
- delete
- variant image nếu có

> **Nguyên tắc chung cho Admin Web**
>
> - Framework: React + Vite + TypeScript.
> - Routing: React Router.
> - HTTP: Axios.
> - Realtime: Socket.io Client.
> - Backend dùng chung: Node.js + Express + TypeScript + MySQL 8.
> - Authentication: JWT access token + refresh token.
> - Chỉ tài khoản `ADMIN` được truy cập hệ thống quản trị.
> - Không hard-code dữ liệu nếu backend đã có API tương ứng.
> - Không tin dữ liệu phía client cho các nghiệp vụ quan trọng; Admin Web chỉ gửi yêu cầu, backend mới là nguồn sự thật.
> - Tách rõ `pages`, `components`, `services/api`, `hooks`, `stores`, `types`, `utils`.
> - Mỗi trang phải có trạng thái loading, empty, error và success.
> - Mọi thao tác create/update/delete phải có thông báo rõ ràng.
> - Các trang danh sách nên có search, filter, pagination nếu backend hỗ trợ.
> - Không hiển thị token/password/hash ra giao diện.
> - Code phải chạy được, không viết pseudo-code.
