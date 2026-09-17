# 06 - Quản lý Brands

## Route
`/brands`

## API
```http
GET    /api/admin/brands
POST   /api/admin/brands
PATCH  /api/admin/brands/:id
DELETE /api/admin/brands/:id
```

Hiển thị:
- logo
- name
- slug
- status
- created_at
- actions

Form:
- name
- slug
- logo_url
- description
- status

Có preview logo, search, filter status và confirm trước khi hide/delete.

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
