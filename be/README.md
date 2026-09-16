# DDTECH Backend

## Bước 16: testing và API documentation

Tài liệu API đầy đủ nằm tại `API.md`; collection tổng hợp nằm tại
`postman/DDTECH_API.postman_collection.json` và hướng dẫn import/chạy nằm tại
`POSTMAN_GUIDE.md`.

Bộ test phần 16 bổ sung toàn bộ lifecycle Auth, promotion theo thời gian/giá trị tối
thiểu và checkout đồng thời không làm tồn kho âm. Chạy toàn bộ 12 integration suites:

```bash
npm test
```

Lệnh trên build TypeScript trước rồi chạy từng suite trong process riêng để mỗi suite tự
khởi tạo và đóng MySQL pool an toàn. Không chạy test bằng database production.

## Bước 15: security, validation và error handling

Các lớp bảo vệ dùng chung:

- `helmet` thiết lập security headers và tắt `x-powered-by`.
- CORS chỉ chấp nhận `ADMIN_WEB_ORIGIN`; địa chỉ localhost/LAN chỉ được cho phép ở môi
  trường development và test.
- Mọi access token được xác minh chữ ký `HS256`, sau đó user và role được đọc lại từ
  database. Tài khoản bị khóa/xóa không thể tiếp tục dùng token cũ.
- Login giới hạn mặc định 10 request/15 phút/IP; refresh token giới hạn 30
  request/15 phút/IP và trả `429` kèm `Retry-After` khi vượt giới hạn.
- Access log không ghi query string để tránh lộ password/token nếu client gửi sai vị trí.
- JSON sai cú pháp trả `400`, dữ liệu không đạt Zod trả `422`, route không tồn tại trả
  `404`; lỗi nội bộ luôn ẩn nội dung và stack trace khỏi response.
- Khi `NODE_ENV=production`, server từ chối khởi động nếu JWT secret vẫn là
  `change_me`, ngắn hơn 32 ký tự hoặc hai secret giống nhau.

Cấu hình rate limit trong `.env`:

```env
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_LOGIN_RATE_LIMIT_MAX=10
AUTH_REFRESH_RATE_LIMIT_MAX=30
```

Chạy kiểm thử tích hợp phần 15:

```bash
npm run build
node tests/security-validation.integration.cjs
```

## Bước 14: admin dashboard và thống kê

Toàn bộ API yêu cầu tài khoản admin:

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/dashboard/revenue?period=7d`
- `GET /api/admin/dashboard/orders-by-status`
- `GET /api/admin/dashboard/top-products?limit=10`
- `GET /api/admin/dashboard/recent-orders?limit=10`
- `GET /api/admin/dashboard/low-stock?threshold=5`

Doanh thu được định nghĩa thống nhất là tổng `total_amount` của các đơn có trạng thái
`DELIVERED`, sử dụng `delivered_at` để xếp vào mốc thời gian. API revenue hỗ trợ
`period=7d`, `period=30d`, `period=12m` hoặc cặp `from=YYYY-MM-DD&to=YYYY-MM-DD`.
Khoảng ngày tùy chỉnh tối đa 366 ngày và kết quả tự điền các ngày/tháng không có doanh
thu bằng 0 để frontend có thể vẽ biểu đồ trực tiếp.

Top sản phẩm được tổng hợp từ snapshot trong `order_items` của đơn `DELIVERED`, không
dựa vào số liệu client gửi lên. Danh sách tồn kho thấp dùng lại nghiệp vụ inventory nên
xử lý đúng cả sản phẩm thường và từng phiên bản đang hoạt động.

Chạy kiểm thử tích hợp phần 14:

```bash
npm run build
node tests/dashboard.integration.cjs
```

## Bước 13: quản lý tồn kho

Toàn bộ API yêu cầu tài khoản admin:

- `GET /api/admin/inventory`
- `GET /api/admin/inventory/transactions`
- `GET /api/admin/inventory/low-stock?threshold=5`
- `POST /api/admin/inventory/adjust`
- `POST /api/admin/inventory/import`

Ví dụ điều chỉnh giảm tồn:

```json
{
  "productId": 1,
  "variantId": null,
  "quantity": -2,
  "note": "Điều chỉnh sau kiểm kê"
}
```

Ví dụ nhập kho phiên bản:

```json
{
  "productId": 2,
  "variantId": 5,
  "quantity": 20,
  "note": "Nhập hàng tháng 9"
}
```

`adjust` nhận quantity âm hoặc dương nhưng khác 0; `import` chỉ nhận quantity
dương. Backend khóa product rồi variant bằng `FOR UPDATE`, kiểm tra không âm/không
tràn giới hạn, cập nhật stock và ghi `inventory_transactions` trong cùng transaction.

Product có phiên bản bắt buộc truyền `variantId`; sau khi thay đổi variant,
`products.stock` được đồng bộ bằng tổng stock các variant. API PATCH product/variant
không còn nhận trường `stock`; mọi thay đổi tồn phải đi qua module inventory.
Stock ban đầu khi admin tạo product hoặc variant được ghi lịch sử `IMPORT`.
Không thể xóa variant còn tồn kho hoặc đổi chế độ variant làm mất tồn.

Sau khi commit, server broadcast `product:stock_updated` và `product:updated`.

Chạy kiểm thử tích hợp phần 13:

```bash
npm run build
node tests/inventory.integration.cjs
```

## Bước 12: thông báo và Socket.io

REST API yêu cầu `Authorization: Bearer <accessToken>`:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Danh sách hỗ trợ `page`, `limit`, `unreadOnly` và `type`. User chỉ có thể xem
hoặc đánh dấu thông báo thuộc tài khoản của mình. Thao tác đọc một thông báo có
tính idempotent; đọc lại không thay đổi `readAt`.

Mobile kết nối Socket.io bằng access token:

```js
const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});
```

Server xác minh JWT và kiểm tra user còn `ACTIVE`, chưa bị xóa. Socket hợp lệ tự
động tham gia room `user:<userId>`; admin tham gia thêm `role:ADMIN`. Socket thiếu
token, token sai/hết hạn hoặc tài khoản bị khóa sẽ bị từ chối.

Các event đang sử dụng:

- Admin: `order:new`, `order:cancelled`, `order:updated`, `review:new`, `notification:new`
- Customer: `order:created`, `order:updated`, `payment:created`, `payment:updated`, `notification:new`
- Broadcast khi cần: `product:updated`, `product:stock_updated`, `promotion:updated`

Notification vẫn được lưu trong MySQL để REST API tải lại khi ứng dụng mở sau;
Socket.io chỉ cung cấp realtime trong lúc ứng dụng đang kết nối.

Chạy kiểm thử tích hợp phần 12:

```bash
npm run build
node tests/notifications-socket.integration.cjs
```

## Bước 11: đánh giá sản phẩm

Public:

- `GET /api/products/:id/reviews`

Khách hàng (yêu cầu `Authorization: Bearer <accessToken>`):

- `POST /api/products/:id/reviews`
- `PATCH /api/reviews/:id`
- `DELETE /api/reviews/:id`

Body tạo review nhận `rating` từ 1 đến 5, `comment` và tối đa 5 URL trong
`images`. Backend tự lấy user từ access token và tự tìm đơn `DELIVERED` thuộc user
có chứa sản phẩm. Nếu tìm thấy, review được lưu với `isVerifiedPurchase: true` và
`orderId`; nếu không thì vẫn là review thường. Một user chỉ đánh giá mỗi sản phẩm
một lần.

Admin:

- `GET /api/admin/reviews`
- `PATCH /api/admin/reviews/:id/status`
- `POST /api/admin/reviews/:id/reply`

Danh sách admin hỗ trợ `productId`, `userId`, `rating`, `status`, `page`, `limit`.
Status gồm `PENDING`, `APPROVED`, `HIDDEN`. Danh sách public chỉ hiển thị review
`APPROVED`.

Sau khi tạo, sửa, xóa, duyệt hoặc ẩn review, backend tính lại `ratingAvg` và
`reviewCount` từ các review `APPROVED` trong cùng transaction.

Chạy kiểm thử tích hợp phần 11:

```bash
npm run build
node tests/reviews.integration.cjs
```

## Bước 10: khuyến mãi

API kiểm tra mã cho khách hàng (yêu cầu `Authorization: Bearer <accessToken>`):

- `POST /api/promotions/validate`

Body chỉ nhận mã khuyến mãi:

```json
{
  "code": "DDTECH10"
}
```

Backend tự tính subtotal theo giá hiện tại của giỏ hàng, kiểm tra sản phẩm, tồn kho,
trạng thái và thời gian hiệu lực của mã, giá trị đơn tối thiểu, tổng giới hạn sử dụng
và giới hạn theo từng tài khoản. Không nhận subtotal hoặc discount từ client.

Admin:

- `GET /api/admin/promotions`
- `POST /api/admin/promotions`
- `PATCH /api/admin/promotions/:id`
- `DELETE /api/admin/promotions/:id`

Hỗ trợ `PERCENT` có `maxDiscount` và `FIXED`; mức giảm luôn bị giới hạn bằng
subtotal nên tổng sau giảm không âm. `DELETE` chuyển promotion sang `INACTIVE`
để giữ lịch sử đơn hàng và lượt sử dụng.

Checkout sử dụng lại cùng nghiệp vụ kiểm tra promotion nhưng khóa bản ghi và kiểm
tra lần cuối trong transaction; kết quả validate trước đó trên mobile không được
dùng làm căn cứ thanh toán.

Chạy kiểm thử tích hợp phần 10:

```bash
npm run build
node tests/promotions.integration.cjs
```

## Bước 09: thanh toán

Các API yêu cầu `Authorization: Bearer <accessToken>`:

- `POST /api/payments/:orderId/create`
- `GET /api/payments/:orderId`

`POST` hiện triển khai đầy đủ cho đơn có `paymentMethod: "COD"`. Body phải là
object rỗng `{}`; backend luôn lấy `amount`, phương thức và trạng thái từ đơn hàng,
không nhận các giá trị này từ client. Gọi tạo nhiều lần trả lại cùng một payment,
không tạo giao dịch COD trùng.

Khách chỉ xem và tạo payment của đơn thuộc tài khoản mình. Admin được xem payment
của mọi đơn. Với VNPAY, MOMO và ZALOPAY, API tạo trả `501` cho đến khi cổng thanh
toán thật được cấu hình. Chưa khai báo callback route để tránh chấp nhận trạng thái
thanh toán không có chữ ký/checksum hợp lệ.

Khi admin chuyển một đơn COD từ `SHIPPING` sang `DELIVERED`, backend cập nhật đồng
thời `orders.payment_status` và `payments.status` thành `PAID` trong cùng transaction,
ghi `paid_at` và tạo notification thanh toán. Nếu chưa có payment COD, payment được
tạo tự động với số tiền lấy từ `orders.total_amount`.

Chạy kiểm thử tích hợp phần 09:

```bash
npm run build
node tests/payments.integration.cjs
```

## Bước 08: đơn hàng và checkout

Customer (yêu cầu `Authorization: Bearer <accessToken>`):

- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/cancel`

Admin:

- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`

Checkout nhận `addressId` hoặc các trường `receiverName`, `receiverPhone`,
`province`, `district`, `ward`, `addressLine`; ngoài ra có `shippingMethodId`,
`promotionCode`, `note`, `paymentMethod`. Giá, tồn kho, phí vận chuyển, khuyến mãi
và tổng tiền đều được backend đọc/tính lại trong transaction.

Ví dụ checkout bằng địa chỉ đã lưu:

```json
{
  "addressId": 1,
  "shippingMethodId": 1,
  "promotionCode": "DDTECH10",
  "note": "Giao giờ hành chính",
  "paymentMethod": "COD"
}
```

Luồng trạng thái admin:

```text
PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED
```

`PENDING`, `CONFIRMED`, `PROCESSING` có thể chuyển sang `CANCELLED`; khách chỉ
được hủy ở `PENDING` hoặc `CONFIRMED`. Hủy đơn hoàn tồn kho, điều chỉnh sold count,
giải phóng lượt voucher, ghi lịch sử kho/trạng thái và notification.

Chạy kiểm thử tích hợp phần 08:

```bash
npm run build
node tests/orders.integration.cjs
```

## Bước 07: giỏ hàng và danh sách yêu thích

Các API yêu cầu `Authorization: Bearer <accessToken>`:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH/DELETE /api/cart/items/:id`
- `DELETE /api/cart`
- `GET /api/favorites`
- `POST/DELETE /api/favorites/:productId`

Mỗi user có một cart và backend tự tạo cart khi cần. Thêm lại cùng product/variant
sẽ cộng quantity. Backend kiểm tra product, variant, trạng thái và stock trong
transaction; giá trong response luôn được đọc từ product hoặc variant hiện tại.
Product có `hasVariants: true` bắt buộc chọn variant thuộc đúng product.

Favorite là duy nhất theo user và product. Chỉ sản phẩm `ACTIVE`, chưa xóa mềm
mới được thêm và hiển thị trong danh sách yêu thích.

Chạy kiểm thử tích hợp phần 07:

```bash
npm run build
node tests/cart-favorites.integration.cjs
```

## Bước 06: sản phẩm, phiên bản và hình ảnh

Public:

- `GET /api/products` hỗ trợ `search`, `category`, `brand`, `minPrice`, `maxPrice`,
  `sort`, `featured`, `new`, `page`, `limit`
- `GET /api/products/:id`
- `GET /api/products/slug/:slug`

`category` và `brand` nhận ID hoặc slug. `sort` nhận `price_asc`, `price_desc`,
`newest`, `best_selling`, `rating`. Public API chỉ trả sản phẩm `ACTIVE` chưa xóa mềm.

Admin (header `Authorization: Bearer <accessToken>`):

- `POST /api/admin/products`, `PATCH/DELETE /api/admin/products/:id`
- `POST /api/admin/products/:id/variants`
- `PATCH/DELETE /api/admin/variants/:id`
- `POST /api/admin/products/:id/images`
- `DELETE /api/admin/product-images/:id`
- `PATCH /api/admin/product-images/:id/primary`

Sản phẩm có `hasVariants: true` lấy stock từ tổng stock các phiên bản. Giá hiển thị
được đồng bộ từ phiên bản có giá thực trả thấp nhất. SKU và slug là duy nhất.
Khi thêm ảnh đầu tiên, backend tự đặt làm ảnh chính; đặt hoặc xóa ảnh chính đều
được xử lý trong transaction để mỗi sản phẩm chỉ có một ảnh chính.

Chạy kiểm thử tích hợp phần 06 (MySQL theo `.env` phải đang hoạt động):

```bash
npm run build
node tests/product.integration.cjs
```

## Bước 05: danh mục, thương hiệu, mẫu thuộc tính

Public: `GET /api/categories`, `GET /api/categories/:slug`,
`GET /api/brands`, `GET /api/brands/:slug`.
Chỉ trả bản ghi `ACTIVE` và chưa xóa mềm. Chi tiết danh mục kèm `attributes`.

Admin (header `Authorization: Bearer <accessToken>`):

- `GET/POST /api/admin/categories`, `PATCH/DELETE /api/admin/categories/:id`
- `GET/POST /api/admin/brands`, `PATCH/DELETE /api/admin/brands/:id`
- `GET/POST /api/admin/categories/:id/attributes`
- `PATCH/DELETE /api/admin/category-attributes/:id`

JSON dùng camelCase. Ví dụ tạo danh mục:

```json
{"name":"Điện thoại","parentId":null,"sortOrder":0,"status":"ACTIVE"}
```

Thương hiệu: `name`, `slug` (tùy chọn), `logoUrl`, `description`, `status`.
Danh mục có thêm `parentId`, `imageUrl`, `sortOrder` (không có `logoUrl`).
Slug tự sinh khi tạo nếu bỏ trống; đổi tên giữ slug cũ trừ khi gửi slug mới.
Slug trùng trả `409`, kể cả trùng bản ghi đã xóa mềm.

Ví dụ thuộc tính:

```json
{"attrKey":"storage","attrName":"Dung lượng","unit":"GB","inputType":"SELECT","options":["128","256"],"isFilterable":true,"sortOrder":0}
```

`inputType` nhận `TEXT`, `NUMBER`, `SELECT`; `SELECT` yêu cầu mảng options không rỗng.
Mã `attrKey` duy nhất trong từng danh mục. PATCH bỏ qua trường không gửi.
Danh mục/thương hiệu DELETE là xóa mềm; thuộc tính DELETE xóa định nghĩa,
không sửa specifications sản phẩm hoặc snapshot đơn hàng.
Thay đổi cây danh mục khóa các dòng danh mục trong transaction để tránh vòng lặp.

Chạy kiểm thử tích hợp (MySQL theo `.env` phải đang hoạt động):

```bash
npm run build
node tests/catalog.integration.cjs
```

Kiểm thử tạo tài khoản và bản ghi tạm riêng, tự xóa chúng trong `finally`.

Backend REST API và realtime server cho DDTECH, sử dụng Express, TypeScript, MySQL và Socket.io.

## Yêu cầu

- Node.js 20 trở lên
- MySQL 8

## Cài đặt và chạy

```bash
npm install
copy .env.example .env
npm run dev
```

Trước khi chạy, hãy tạo database `ddtech` và cập nhật các biến `DB_*` trong `.env`.
Sau khi import schema, cài hoặc cập nhật toàn bộ stored procedure:

```bash
npm run db:procedures
```

Các repository gọi procedure qua `executeProcedure`/`executeDynamicProcedure`; không
thực thi trực tiếp `SELECT`, `INSERT`, `UPDATE` hoặc `DELETE` bằng `.execute()`.
Server chỉ bắt đầu lắng nghe sau khi kết nối MySQL và chạy `SELECT 1` thành công.

Nếu dùng macOS/Linux, thay lệnh `copy` bằng `cp`.

Các lệnh chính:

```bash
npm run dev
npm run db:procedures
npm run typecheck
npm run build
npm start
```

## Kiểm tra health API

Mở `http://localhost:5000/api/health` hoặc chạy:

```bash
curl http://localhost:5000/api/health
```

Response có định dạng:

```json
{
  "success": true,
  "message": "DDTECH API đang hoạt động",
  "data": {
    "status": "ok",
    "timestamp": "2026-01-01T00:00:00.000Z",
    "uptime": 1.23
  }
}
```
