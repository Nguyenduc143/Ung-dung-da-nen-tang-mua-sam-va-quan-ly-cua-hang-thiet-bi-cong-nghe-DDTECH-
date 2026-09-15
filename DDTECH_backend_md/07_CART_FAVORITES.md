# 07 - Cart và Favorites

## Bảng

```text
carts
cart_items
favorites
products
product_variants
```

## Cart API

```http
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
DELETE /api/cart
```

Input thêm giỏ:

```json
{
  "productId": 1,
  "variantId": null,
  "quantity": 2
}
```

## Quy tắc cart

- Mỗi user chỉ có một cart.
- Nếu chưa có cart thì tự tạo.
- Nếu item đã tồn tại thì cộng quantity thay vì INSERT duplicate.
- Nếu có variant, xác minh variant thuộc đúng product.
- Không cho thêm product/variant INACTIVE.
- Không cho quantity <= 0.
- Có thể kiểm tra stock khi add cart, nhưng checkout vẫn phải kiểm tra lại.
- Giá trả về cart phải đọc từ DB hiện tại, không lưu giá vào cart_items.

## Favorites API

```http
GET    /api/favorites
POST   /api/favorites/:productId
DELETE /api/favorites/:productId
```

Một user không favorite cùng product nhiều lần.

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
