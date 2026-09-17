# 09 - Quản lý Kho hàng

## Route
`/inventory`

## API
```http
GET  /api/admin/inventory
GET  /api/admin/inventory/transactions
POST /api/admin/inventory/adjust
POST /api/admin/inventory/import
GET  /api/admin/inventory/low-stock
```

Hiển thị:
- product
- variant
- SKU
- stock
- stock status
- updated_at

Nhập kho:
- product
- variant
- quantity
- note

Điều chỉnh:
- product
- variant
- quantity change
- reason/note

Lịch sử:
- type
- quantity
- stock_after
- reference
- note
- created_by
- created_at

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
