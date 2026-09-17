# 14 - Dashboard Admin

## Route
`/dashboard`

## API
```http
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/revenue
GET /api/admin/dashboard/orders-by-status
GET /api/admin/dashboard/top-products
GET /api/admin/dashboard/recent-orders
GET /api/admin/dashboard/low-stock
```

Summary cards:
- doanh thu
- số đơn
- số khách hàng
- số sản phẩm
- doanh thu hôm nay
- pending orders

Charts:
- revenue 7d / 30d / 12m / custom
- orders by status

Sections:
- top products
- recent orders
- low stock

Khuyến nghị dùng Recharts.

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
