# 12 - Notifications và Socket.io

## Bảng

```text
notifications
users
orders
```

## REST API

```http
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

User chỉ đọc/update notification của chính họ.

## Socket Authentication

Khi client connect Socket.io:

- gửi access token
- server verify JWT
- xác định user id và role
- reject socket nếu token sai/hết hạn

## Rooms

Sau khi authenticated:

```text
user:<userId>
role:ADMIN
```

Ví dụ:

```text
user:15
role:ADMIN
```

## Events đề xuất

Server -> Admin:

```text
order:new
order:cancelled
review:new
```

Server -> Customer:

```text
order:updated
payment:updated
notification:new
product:updated
```

Server -> tất cả mobile khi cần:

```text
product:updated
product:stock_updated
promotion:updated
```

## Luồng order

Mobile tạo order:

```text
REST POST /api/orders
-> DB transaction
-> lưu notification
-> io.to("role:ADMIN").emit("order:new", ...)
```

Admin đổi trạng thái:

```text
PATCH /api/admin/orders/:id/status
-> DB update
-> lưu notification
-> io.to("user:<id>").emit("order:updated", ...)
```

## Lưu ý

Socket.io chỉ phục vụ realtime khi app đang kết nối.

Nếu sau này cần push notification khi app đóng, thêm Expo Push Notification và bảng device tokens riêng.

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
