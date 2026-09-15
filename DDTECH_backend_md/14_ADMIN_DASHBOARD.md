# 14 - Admin Dashboard và Statistics

## Chỉ ADMIN được truy cập

Prefix:

```text
/api/admin/dashboard
```

## API đề xuất

```http
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/revenue
GET /api/admin/dashboard/orders-by-status
GET /api/admin/dashboard/top-products
GET /api/admin/dashboard/recent-orders
GET /api/admin/dashboard/low-stock
```

## Summary

Trả:

- total revenue
- orders count
- customer count
- product count
- today revenue
- pending orders

## Revenue

Hỗ trợ query:

```text
period=7d
period=30d
period=12m
from
to
```

Chỉ tính doanh thu theo nghiệp vụ đã thống nhất, khuyến nghị các order:

```text
status = DELIVERED
```

hoặc theo `payment_status = PAID` nếu muốn thống kê tiền thực nhận.

Phải chốt một định nghĩa và dùng nhất quán.

## Top products

Có thể dùng:

- `products.sold_count`
- hoặc SUM(order_items.quantity) với order hợp lệ

Nếu cần báo cáo chính xác lịch sử, ưu tiên dữ liệu `order_items`.

## Performance

Dùng index hiện có.

Không `SELECT *` cho dashboard nếu không cần.

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
