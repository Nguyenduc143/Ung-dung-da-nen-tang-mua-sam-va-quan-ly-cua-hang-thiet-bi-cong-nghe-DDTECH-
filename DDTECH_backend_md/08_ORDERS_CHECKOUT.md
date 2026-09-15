# 08 - Orders và Checkout

## Bảng liên quan

```text
orders
order_items
order_status_history
carts
cart_items
products
product_variants
shipping_methods
promotions
promotion_usages
inventory_transactions
notifications
```

Đây là module quan trọng nhất.

## Customer API

```http
POST  /api/orders
GET   /api/orders/my-orders
GET   /api/orders/:id
PATCH /api/orders/:id/cancel
```

## Admin API

```http
GET   /api/admin/orders
GET   /api/admin/orders/:id
PATCH /api/admin/orders/:id/status
```

## Checkout phải dùng transaction

Trình tự:

```text
BEGIN

1. đọc cart của user
2. khóa product/variant cần mua bằng SELECT ... FOR UPDATE
3. kiểm tra ACTIVE
4. kiểm tra stock
5. tính lại price/sale_price từ DB
6. tính subtotal
7. kiểm tra shipping method
8. validate promotion nếu có
9. tính shipping_fee
10. tính discount
11. tính total_amount
12. tạo orders
13. tạo order_items snapshot
14. trừ stock
15. tăng sold_count
16. ghi inventory_transactions
17. ghi promotion_usages nếu có
18. ghi order_status_history
19. xóa cart_items
20. tạo notification

COMMIT
```

Nếu bất kỳ bước nào lỗi:

```text
ROLLBACK
```

## Không tin dữ liệu từ client

Client có thể gửi:

- addressId hoặc thông tin nhận hàng
- shippingMethodId
- promotionCode
- note
- paymentMethod

Client KHÔNG được quyết định:

- price
- subtotal
- discount_amount
- total_amount
- stock
- sold_count
- payment_status

## Order Code

Không dùng:

```sql
MAX(id) + 1
```

để sinh mã đơn vì có race condition.

Backend hãy sinh mã order unique an toàn, ví dụ:

```text
DD + timestamp ngắn + random
```

và retry nếu va chạm UNIQUE.

## Snapshot order_items

Phải lưu:

- product_name
- product_sku
- product_image
- variant_name
- original_price
- price
- quantity

để thay đổi product sau này không ảnh hưởng đơn cũ.

## Cancel

Khách chỉ được hủy khi trạng thái cho phép, ví dụ:

```text
PENDING
CONFIRMED
```

Khi cancel:

- transaction
- hoàn stock
- giảm/điều chỉnh sold_count phù hợp
- ghi inventory transaction `CANCEL_ORDER`
- ghi order_status_history
- cập nhật promotion usage nếu nghiệp vụ yêu cầu
- emit Socket.io

## Status transition

Không cho admin nhảy trạng thái vô lý.

Ví dụ hợp lệ:

```text
PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED
```

và một số bước được chuyển sang `CANCELLED`.

Không có API delete order.

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
