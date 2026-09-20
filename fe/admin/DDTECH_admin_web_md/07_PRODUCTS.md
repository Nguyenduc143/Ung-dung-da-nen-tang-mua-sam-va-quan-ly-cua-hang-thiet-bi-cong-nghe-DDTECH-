# 07 - Quản lý Products

## Routes
```text
/products
/products/create
/products/:id/edit
```

## API
```http
GET    /api/admin/products
GET    /api/products/:id
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
```

Danh sách:
- ảnh chính
- name
- SKU
- category
- brand
- price
- sale_price
- stock
- sold_count
- status
- featured
- new
- updated_at

Filter:
- search
- category
- brand
- status
- price
- featured
- new

Form:
- name
- slug
- sku
- category_id
- brand_id
- short_description
- description
- specifications
- price
- sale_price
- warranty_months
- weight_gram
- is_featured
- is_new
- status
- has_variants

Khi chọn category, load category attributes và render form specifications động.

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
