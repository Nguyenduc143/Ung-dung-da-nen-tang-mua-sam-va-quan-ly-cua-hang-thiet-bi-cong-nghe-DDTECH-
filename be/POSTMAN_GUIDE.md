# Hướng dẫn Postman toàn bộ DDTECH API

Collection:

```text
postman/DDTECH_API.postman_collection.json
```

## Chuẩn bị

1. MySQL chạy ở cổng `3306` và database đã import `ddtech.sql`.
2. Tại thư mục `be`, chạy `npm install` rồi `npm run dev`.
3. Import collection bằng nút **Import** của Postman.
4. Mở tab **Variables** của collection và cấu hình các giá trị phù hợp database local.

Các biến đăng nhập:

| Biến | Ý nghĩa |
|---|---|
| `baseUrl` | Mặc định `http://localhost:5000/api` |
| `userEmail`, `userPassword`, `userPhone` | Tài khoản customer dùng để test |
| `adminEmail`, `adminPassword` | Tài khoản admin đang `ACTIVE` |
| `accessToken`, `refreshToken`, `adminAccessToken` | Được request login/refresh tự lưu |

Các biến dữ liệu như `categoryId`, `brandId`, `productId`, `addressId`,
`shippingMethodId`, `orderId`, `reviewId` và `notificationId` phải trỏ tới bản ghi phù
hợp trong database. Một số request create tự cập nhật ID tương ứng.

## Thứ tự test đề xuất

1. Chạy `Auth/Login User` để lưu token customer. Nếu chưa có tài khoản, chạy Register
   trước; chạy lại Register cùng email sẽ nhận `409`.
2. Tạo hoặc chọn một address trong group Users.
3. Chọn product thường đang `ACTIVE`, còn stock và điền `productId`; thêm vào Cart.
4. Chạy checkout trong Orders, collection tự lưu `orderId`.
5. Chạy Payments, Reviews và Notifications bằng customer token.
6. Chạy `Admin/Login Admin`; request này lưu admin token. Sau đó chạy các request còn
   lại trong group Admin.
7. Muốn quay lại request customer sau khi Login Admin, chạy lại `Auth/Login User`.

Không chạy đồng thời các request phụ thuộc ID. Request xóa/cancel/update status thay đổi
trạng thái dữ liệu thật trong database local.

## Lưu ý khi test product

- Product thường: `hasVariants=false`, giỏ hàng gửi `variantId=null`.
- Product có phiên bản: điền `variantId` thuộc đúng product.
- Stock không được cập nhật bằng PATCH product/variant; dùng Inventory Adjust hoặc Import.
- Giá, tổng tiền, discount, role, stock và payment status đều do backend quyết định.

## Kết quả HTTP thường gặp

- `401`: chưa login, token hết hạn hoặc tài khoản đã khóa.
- `403`: customer gọi API Admin.
- `404`: ID không tồn tại hoặc tài nguyên không thuộc tài khoản đang login.
- `409`: xung đột nghiệp vụ như hết stock, SKU trùng hoặc trạng thái order sai.
- `422`: body/query không đúng schema.
- `429`: gọi login/refresh quá giới hạn; chờ số giây trong header `Retry-After`.

Chi tiết đầy đủ của từng endpoint nằm trong `API.md`.
