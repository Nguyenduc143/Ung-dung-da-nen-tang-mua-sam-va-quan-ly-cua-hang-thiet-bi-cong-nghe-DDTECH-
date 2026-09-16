# DDTECH REST API

Tài liệu này mô tả API đã triển khai từ phần 01 đến 16. Base URL mặc định:

```text
http://localhost:5000/api
```

## Quy ước chung

- `Public`: không cần token.
- `Customer`: header `Authorization: Bearer <accessToken>`, tài khoản phải đang hoạt động.
- `Admin`: giống Customer và role hiện tại trong database phải là `ADMIN`.
- Request JSON phải có `Content-Type: application/json`.
- Các schema Zod là strict: trường không được khai báo sẽ trả `422`.
- ID là số nguyên dương. Tiền là số không âm và được backend tính lại ở các nghiệp vụ
  giỏ hàng, checkout, promotion và payment.

Response thành công:

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {}
}
```

Response lỗi:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "data": null,
  "errors": { "field": ["Chi tiết lỗi"] }
}
```

Mã lỗi chung: `400` JSON sai, `401` thiếu/token sai/tài khoản không hoạt động, `403`
sai quyền, `404` không tìm thấy hoặc không sở hữu tài nguyên, `409` xung đột nghiệp
vụ, `413` body quá 1 MB, `422` validation, `429` vượt rate limit, `500` lỗi nội bộ.

## Health

| Method | URL | Auth | Input | `data` khi thành công | Lỗi |
|---|---|---|---|---|---|
| GET | `/health` | Public | Không | `{ status, timestamp, uptime }` | `500` |

## Auth

Login tối đa 10 lần và refresh tối đa 30 lần trong 15 phút trên mỗi IP theo cấu hình
mặc định.

| Method | URL | Auth | Body | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| POST | `/auth/register` | Public | `fullName`, `email`, `phone`, `password` | `{ user }` | `409`, `422` |
| POST | `/auth/login` | Public | `email`, `password` | `{ user, accessToken, refreshToken }` | `401`, `403`, `422`, `429` |
| POST | `/auth/refresh-token` | Public | `refreshToken` | `{ accessToken, refreshToken }` | `401`, `422`, `429` |
| POST | `/auth/logout` | Public | `refreshToken` | `null` | `401`, `422` |
| POST | `/auth/logout-all` | Customer/Admin | Không | `{ revokedCount }` | `401` |
| GET | `/auth/me` | Customer/Admin | Không | `{ user }` | `401` |

Ví dụ đăng ký:

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0912345678",
  "password": "Password123!"
}
```

Refresh token được xoay vòng sau mỗi lần refresh; token cũ không thể sử dụng lại.
Database chỉ lưu SHA-256 hash của refresh token.

## Users và Addresses

| Method | URL | Auth | Body/query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/users/me` | Customer/Admin | Không | `{ user }` | `401`, `404` |
| PATCH | `/users/me` | Customer/Admin | Một hoặc nhiều: `fullName`, `phone`, `avatarUrl`, `gender`, `dateOfBirth` | `{ user }` | `401`, `409`, `422` |
| PATCH | `/users/me/password` | Customer/Admin | `currentPassword`, `newPassword` | `null` | `401`, `422` |
| GET | `/addresses` | Customer/Admin | Không | `{ addresses }` | `401` |
| POST | `/addresses` | Customer/Admin | Thông tin địa chỉ bên dưới | `{ address }` | `401`, `422` |
| PATCH | `/addresses/:id` | Customer/Admin | Các trường địa chỉ cần đổi | `{ address }` | `401`, `404`, `422` |
| DELETE | `/addresses/:id` | Customer/Admin | Không | `null` | `401`, `404`, `422` |
| PATCH | `/addresses/:id/default` | Customer/Admin | Không | `{ address }` | `401`, `404`, `422` |
| GET | `/admin/users` | Admin | `page`, `limit<=100`, `search`, `role`, `status` | `{ users, pagination }` | `401`, `403`, `422` |
| GET | `/admin/users/:id` | Admin | Không | `{ user }` | `401`, `403`, `404`, `422` |
| PATCH | `/admin/users/:id/status` | Admin | `status: ACTIVE\|LOCKED` | `{ user }` | `401`, `403`, `404`, `409`, `422` |

Body tạo địa chỉ:

```json
{
  "receiverName": "Nguyễn Văn A",
  "receiverPhone": "0912345678",
  "province": "Hà Nội",
  "district": "Đống Đa",
  "ward": "Láng Hạ",
  "addressLine": "12 Nguyễn Chí Thanh",
  "addressType": "HOME",
  "isDefault": true
}
```

## Categories, Brands và Attributes

| Method | URL | Auth | Body | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/categories` | Public | Không | Mảng category public | `500` |
| GET | `/categories/:slug` | Public | Không | Category | `404`, `422` |
| GET | `/brands` | Public | Không | Mảng brand public | `500` |
| GET | `/brands/:slug` | Public | Không | Brand | `404`, `422` |
| GET | `/admin/categories` | Admin | Không | Tất cả category | `401`, `403` |
| POST | `/admin/categories` | Admin | `name`; tùy chọn `slug`, `parentId`, `description`, `imageUrl`, `sortOrder`, `status` | Category | `401`, `403`, `409`, `422` |
| PATCH | `/admin/categories/:id` | Admin | Các trường category cần đổi | Category | `401`, `403`, `404`, `409`, `422` |
| DELETE | `/admin/categories/:id` | Admin | Không | `null` | `401`, `403`, `404`, `409`, `422` |
| GET | `/admin/brands` | Admin | Không | Tất cả brand | `401`, `403` |
| POST | `/admin/brands` | Admin | `name`; tùy chọn `slug`, `logoUrl`, `description`, `status` | Brand | `401`, `403`, `409`, `422` |
| PATCH | `/admin/brands/:id` | Admin | Các trường brand cần đổi | Brand | `401`, `403`, `404`, `409`, `422` |
| DELETE | `/admin/brands/:id` | Admin | Không | `null` | `401`, `403`, `404`, `422` |
| GET | `/admin/categories/:id/attributes` | Admin | Không | Mảng attribute | `401`, `403`, `404`, `422` |
| POST | `/admin/categories/:id/attributes` | Admin | `attrKey`, `attrName`; tùy chọn `unit`, `inputType`, `options`, `isFilterable`, `sortOrder` | Attribute | `401`, `403`, `404`, `409`, `422` |
| PATCH | `/admin/category-attributes/:id` | Admin | Các trường attribute cần đổi | Attribute | `401`, `403`, `404`, `409`, `422` |
| DELETE | `/admin/category-attributes/:id` | Admin | Không | `null` | `401`, `403`, `404`, `422` |

## Products, Variants và Images

| Method | URL | Auth | Body/query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/products` | Public | Query: `search`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`, `featured`, `new`, `page`, `limit<=100` | `{ products, pagination }` | `422` |
| GET | `/products/:id` | Public | Không | `{ product, variants, images, specifications }` | `404`, `422` |
| GET | `/products/slug/:slug` | Public | Không | Như detail theo ID | `404`, `422` |
| POST | `/admin/products` | Admin | Product body bên dưới | `{ product }` | `401`, `403`, `404`, `409`, `422` |
| PATCH | `/admin/products/:id` | Admin | Các trường product cần đổi, không nhận `stock` | `{ product }` | `401`, `403`, `404`, `409`, `422` |
| DELETE | `/admin/products/:id` | Admin | Không | `null` | `401`, `403`, `404`, `409`, `422` |
| POST | `/admin/products/:id/variants` | Admin | `sku`, `variantName`, `price`; tùy chọn `attributes`, `salePrice`, `stock`, `imageUrl`, `sortOrder`, `status` | `{ variant }` | `401`, `403`, `404`, `409`, `422` |
| PATCH | `/admin/variants/:id` | Admin | Các trường variant cần đổi, không nhận `stock` | `{ variant }` | `401`, `403`, `404`, `409`, `422` |
| DELETE | `/admin/variants/:id` | Admin | Không | `null` | `401`, `403`, `404`, `409`, `422` |
| POST | `/admin/products/:id/images` | Admin | `imageUrl`; tùy chọn `variantId`, `altText`, `isPrimary`, `sortOrder` | `{ image }` | `401`, `403`, `404`, `422` |
| DELETE | `/admin/product-images/:id` | Admin | Không | `null` | `401`, `403`, `404`, `422` |
| PATCH | `/admin/product-images/:id/primary` | Admin | Không | `{ image }` | `401`, `403`, `404`, `422` |

Ví dụ tạo product:

```json
{
  "categoryId": 1,
  "brandId": 1,
  "name": "Laptop DDTECH Pro",
  "sku": "DD-LAPTOP-PRO",
  "shortDescription": "Laptop phục vụ học tập và làm việc",
  "description": "Mô tả chi tiết",
  "specifications": { "cpu": "Core i7", "ram": "16GB" },
  "price": 20000000,
  "salePrice": 18900000,
  "stock": 10,
  "hasVariants": false,
  "warrantyMonths": 24,
  "weightGram": 1700,
  "isFeatured": true,
  "isNew": true,
  "status": "ACTIVE"
}
```

## Cart và Favorites

| Method | URL | Auth | Body | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/cart` | Customer/Admin | Không | `{ cart, items, summary }` | `401` |
| POST | `/cart/items` | Customer/Admin | `productId`, tùy chọn `variantId`, `quantity` | Giỏ hàng mới nhất | `401`, `404`, `409`, `422` |
| PATCH | `/cart/items/:id` | Customer/Admin | `quantity` | Giỏ hàng mới nhất | `401`, `404`, `409`, `422` |
| DELETE | `/cart/items/:id` | Customer/Admin | Không | `null` | `401`, `404`, `422` |
| DELETE | `/cart` | Customer/Admin | Không | `{ removedCount }` | `401` |
| GET | `/favorites` | Customer/Admin | Không | `{ favorites }` | `401` |
| POST | `/favorites/:productId` | Customer/Admin | Không | `{ favorite }` | `401`, `404`, `409`, `422` |
| DELETE | `/favorites/:productId` | Customer/Admin | Không | `null` | `401`, `404`, `422` |

## Orders và Checkout

| Method | URL | Auth | Body/query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| POST | `/orders` | Customer/Admin | Checkout body bên dưới | `{ order, items, statusHistory }` | `401`, `404`, `409`, `422` |
| GET | `/orders/my-orders` | Customer/Admin | `page`, `limit<=100`, `status` | `{ orders, pagination }` | `401`, `422` |
| GET | `/orders/:id` | Customer/Admin | Không | `{ order, items, statusHistory }` | `401`, `404`, `422` |
| PATCH | `/orders/:id/cancel` | Customer/Admin | `reason` | Chi tiết order | `401`, `404`, `409`, `422` |
| GET | `/admin/orders` | Admin | `page`, `limit<=100`, `search`, `status`, `paymentStatus`, `paymentMethod`, `userId` | `{ orders, pagination }` | `401`, `403`, `422` |
| GET | `/admin/orders/:id` | Admin | Không | Chi tiết order | `401`, `403`, `404`, `422` |
| PATCH | `/admin/orders/:id/status` | Admin | `status`; tùy chọn `note` | Chi tiết order | `401`, `403`, `404`, `409`, `422` |

Checkout bằng địa chỉ đã lưu:

```json
{
  "addressId": 1,
  "shippingMethodId": 1,
  "promotionCode": "DDTECH10",
  "note": "Giao giờ hành chính",
  "paymentMethod": "COD"
}
```

Có thể thay `addressId` bằng đủ `receiverName`, `receiverPhone`, `province`, `district`,
`ward`, `addressLine`. Backend khóa tồn kho trong transaction, tự lấy giá và không nhận
`totalAmount`, `stock` hoặc `paymentStatus` từ client.

## Payments

| Method | URL | Auth | Body | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| POST | `/payments/:orderId/create` | Customer/Admin | `{}` | `{ payment }` | `401`, `404`, `409`, `422`, `501` |
| GET | `/payments/:orderId` | Customer/Admin | Không | `{ payment, order }` | `401`, `404`, `422` |

Hiện tại chỉ COD được triển khai. VNPAY, MOMO và ZALOPAY trả `501` cho tới khi có cấu
hình cổng và kiểm tra chữ ký callback thực tế.

## Promotions

| Method | URL | Auth | Body | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| POST | `/promotions/validate` | Customer/Admin | `code` | `{ promotion, subtotal, discountAmount, totalAfterDiscount }` | `401`, `404`, `409`, `422` |
| GET | `/admin/promotions` | Admin | Không | `{ promotions }` | `401`, `403` |
| POST | `/admin/promotions` | Admin | Promotion body bên dưới | Promotion | `401`, `403`, `409`, `422` |
| PATCH | `/admin/promotions/:id` | Admin | Các trường promotion cần đổi | Promotion | `401`, `403`, `404`, `409`, `422` |
| DELETE | `/admin/promotions/:id` | Admin | Không | `null` | `401`, `403`, `404`, `422` |

```json
{
  "code": "DDTECH10",
  "name": "Giảm 10%",
  "discountType": "PERCENT",
  "discountValue": 10,
  "maxDiscount": 500000,
  "minOrderValue": 1000000,
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "startDate": "2026-09-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.000Z",
  "status": "ACTIVE"
}
```

## Reviews

| Method | URL | Auth | Body/query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/products/:productId/reviews` | Public | `page`, `limit<=100`, `rating` | `{ reviews, pagination }` | `404`, `422` |
| POST | `/products/:productId/reviews` | Customer/Admin | `rating`; tùy chọn `comment`, `images` tối đa 5 URL | Review | `401`, `404`, `409`, `422` |
| PATCH | `/reviews/:id` | Customer/Admin, owner | Các trường review cần đổi | Review | `401`, `404`, `409`, `422` |
| DELETE | `/reviews/:id` | Customer/Admin, owner | Không | `null` | `401`, `404`, `422` |
| GET | `/admin/reviews` | Admin | `page`, `limit<=100`, `productId`, `userId`, `rating`, `status` | `{ reviews, pagination }` | `401`, `403`, `422` |
| PATCH | `/admin/reviews/:id/status` | Admin | `status: PENDING\|APPROVED\|HIDDEN` | Review | `401`, `403`, `404`, `422` |
| POST | `/admin/reviews/:id/reply` | Admin | `reply` | Review | `401`, `403`, `404`, `422` |

## Notifications và Socket.io

| Method | URL | Auth | Body/query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/notifications` | Customer/Admin | `page`, `limit<=100`, `unreadOnly`, `type` | `{ notifications, pagination }` | `401`, `422` |
| GET | `/notifications/unread-count` | Customer/Admin | Không | `{ unreadCount }` | `401` |
| PATCH | `/notifications/:id/read` | Customer/Admin, owner | `{}` | Notification | `401`, `404`, `422` |
| PATCH | `/notifications/read-all` | Customer/Admin | `{}` | `{ updatedCount }` | `401`, `422` |

Socket.io kết nối vào origin server, không thêm `/api`:

```js
const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});
```

Room tự động: `user:<userId>` và thêm `role:ADMIN` cho admin. Event hiện có gồm
`order:new`, `order:created`, `order:cancelled`, `order:updated`, `payment:created`,
`payment:updated`, `review:new`, `notification:new`, `product:updated`,
`product:stock_updated`, `promotion:updated`.

## Inventory

| Method | URL | Auth | Body/query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/admin/inventory` | Admin | `page`, `limit<=100`, `search`, `status` | `{ products, pagination }` | `401`, `403`, `422` |
| GET | `/admin/inventory/transactions` | Admin | `page`, `limit`, `productId`, `variantId`, `createdBy`, `type`, `dateFrom`, `dateTo` | `{ transactions, pagination }` | `401`, `403`, `422` |
| GET | `/admin/inventory/low-stock` | Admin | `threshold`, mặc định 5 | `{ threshold, items }` | `401`, `403`, `422` |
| POST | `/admin/inventory/adjust` | Admin | `productId`, tùy chọn `variantId`, `quantity != 0`, `note` | `{ transaction, stock }` | `401`, `403`, `404`, `409`, `422` |
| POST | `/admin/inventory/import` | Admin | `productId`, tùy chọn `variantId`, `quantity > 0`, `note` | `{ transaction, stock }` | `401`, `403`, `404`, `422` |

Sản phẩm có phiên bản bắt buộc gửi `variantId`; sản phẩm thường không được gửi
`variantId`. Mọi thay đổi stock được khóa và ghi `inventory_transactions` trong cùng
transaction.

## Admin Dashboard

| Method | URL | Auth | Query | `data` khi thành công | Lỗi chính |
|---|---|---|---|---|---|
| GET | `/admin/dashboard/summary` | Admin | Không | Tổng revenue/order/customer/product, revenue hôm nay, order pending | `401`, `403`, `422` |
| GET | `/admin/dashboard/revenue` | Admin | `period=7d\|30d\|12m` hoặc `from` + `to` | `{ period, from, to, groupBy, totalRevenue, ordersCount, points }` | `401`, `403`, `422` |
| GET | `/admin/dashboard/orders-by-status` | Admin | Không | `{ total, statuses }` | `401`, `403`, `422` |
| GET | `/admin/dashboard/top-products` | Admin | `limit<=50` | `{ revenueDefinition, products }` | `401`, `403`, `422` |
| GET | `/admin/dashboard/recent-orders` | Admin | `limit<=50` | `{ orders }` | `401`, `403`, `422` |
| GET | `/admin/dashboard/low-stock` | Admin | `threshold`, mặc định 5 | `{ threshold, items }` | `401`, `403`, `422` |

Dashboard định nghĩa doanh thu là tổng `orders.total_amount` của đơn `DELIVERED` và
xếp thời gian theo `delivered_at`.

## Chạy test

Test sử dụng database cấu hình trong `.env`, tự tạo dữ liệu có prefix riêng và chỉ dọn
các bản ghi do chính test tạo. Không chạy test trên database production.

```powershell
npm test
```

Nếu đã build và chỉ muốn chạy integration tests:

```powershell
npm run test:integration
```

Chạy riêng một suite:

```powershell
npm run build
node tests/auth.integration.cjs
```
