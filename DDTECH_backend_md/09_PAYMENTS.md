# 09 - Payments

## Bảng

```text
payments
orders
```

## Phương thức

```text
COD
VNPAY
MOMO
ZALOPAY
```

COD và VNPAY 2.1.0 đã được triển khai.

## API đề xuất

```http
POST /api/payments/:orderId/create
GET  /api/payments/:orderId
GET  /api/payments/vnpay/return
GET  /api/payments/vnpay/ipn
POST /api/payments/momo/callback
```

Return URL chỉ điều hướng người dùng. IPN xác minh HMAC-SHA512 và là nơi cập nhật
trạng thái giao dịch trong transaction.

## COD

- order tạo với `payment_status = UNPAID`
- khi giao thành công có thể cập nhật PAID tùy nghiệp vụ

## Đồng bộ trạng thái

Database có:

```text
orders.payment_status
payments.status
```

Khi cập nhật thanh toán phải dùng transaction để hai nơi không lệch nhau.

## Security

- Không tin callback payment chỉ vì client nói thành công.
- Khi tích hợp gateway phải verify signature/checksum.
- `amount` phải đối chiếu với order.
- callback nên xử lý idempotent.
- `transaction_code` phải unique khi có.

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
