# Hướng dẫn kiểm thử API phần 06 bằng Postman

Collection đi kèm:

```text
postman/DDTECH_Part06.postman_collection.json
```

Collection kiểm thử các API Product, Variant và Product Image, bao gồm cả các
trường hợp thành công và validation lỗi.

## 1. Chuẩn bị backend

Đảm bảo MySQL đang chạy tại cổng `3306` và file `.env` có cấu hình đúng.

Tại thư mục `be`, chạy:

```powershell
npm install
npm run dev
```

Kiểm tra trình duyệt hoặc Postman có thể truy cập:

```text
http://localhost:5000/api/health
```

## 2. Chuẩn bị tài khoản ADMIN

Collection cần một tài khoản có `role = ADMIN`, `status = ACTIVE` và
`deleted_at IS NULL`.

Nếu chưa có tài khoản, đăng ký bằng API:

```http
POST /api/auth/register
```

Sau đó, trong môi trường local development, đổi role của đúng tài khoản vừa tạo:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'email-cua-ban@example.com';
```

Không cho phép client gửi role khi đăng ký; việc đổi role trên chỉ dùng để chuẩn
bị tài khoản quản trị trong database local.

## 3. Import Collection

Trong Postman:

1. Chọn **Import**.
2. Chọn tab **File** và mở
   `postman/DDTECH_Part06.postman_collection.json`.
3. Hoặc mở file JSON, sao chép toàn bộ nội dung rồi dán vào phần **Raw text**.
4. Chọn **Import**.

## 4. Cấu hình biến Collection

Mở collection **DDTECH Backend - Part 06 Products**, chọn tab **Variables** và
điền:

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `baseUrl` | `http://localhost:5000` | Đã có sẵn |
| `adminEmail` | Email tài khoản admin | Bắt buộc |
| `adminPassword` | Mật khẩu tài khoản admin | Bắt buộc |
| `categoryId` | Có thể để trống | Request chuẩn bị sẽ tự lấy |
| `brandId` | Có thể để trống | Request chuẩn bị sẽ tự lấy |

Các biến còn lại được collection tự động cập nhật:

- `accessToken`
- `testSuffix`
- `productId`
- `productSlug`
- `variantId`
- `primaryImageId`
- `secondImageId`

Nhấn **Save** sau khi nhập email và mật khẩu.

## 5. Dữ liệu Category và Brand

Hai request sau tự lấy bản ghi public đầu tiên và lưu ID:

```text
00 - Chuẩn bị/03 - Lấy Category ID
00 - Chuẩn bị/04 - Lấy Brand ID
```

Database phải có ít nhất một category và một brand đang `ACTIVE`, chưa bị xóa
mềm. Nếu danh sách trống, tạo dữ liệu bằng API phần 05 trước hoặc nhập trực tiếp
`categoryId` và `brandId` hợp lệ trong Collection Variables.

## 6. Thứ tự chạy thủ công

Chạy lần lượt từ trên xuống dưới:

### Folder 00 - Chuẩn bị

1. `Health Check` kiểm tra server.
2. `Login Admin` tự lưu access token.
3. `Lấy Category ID` tự lưu category.
4. `Lấy Brand ID` tự lưu brand.

### Folder 01 - Admin Product CRUD

1. Tạo product và tự lưu `productId`, `productSlug`.
2. Gửi SKU trùng, kết quả mong đợi là `409`.
3. Gửi `salePrice > price`, kết quả mong đợi là `422`.
4. Cập nhật product.

Product test được tạo với `hasVariants = true`. Vì vậy stock gửi trong product
không được dùng làm stock thực tế; trước khi có variant, stock product bằng `0`.

### Folder 02 - Admin Variants và Images

1. Tạo variant và tự lưu `variantId`.
2. Cập nhật giá khuyến mãi và stock variant.
3. Thêm ảnh đầu tiên; backend tự đặt ảnh này làm ảnh chính.
4. Thêm ảnh chính mới.
5. Đặt lại ảnh đầu tiên làm ảnh chính.

Sau khi cập nhật variant, product phải tự đồng bộ:

```json
{
  "price": 16000000,
  "salePrice": 14500000,
  "stock": 12
}
```

### Folder 03 - Public Products

Folder này kiểm tra:

- Search và filter.
- Filter theo category và brand.
- Khoảng giá.
- `featured`, `new`.
- Sort và pagination.
- Detail theo ID.
- Detail theo slug.
- Danh sách variant, images và duy nhất một ảnh chính.

### Folder 04 - Dọn dữ liệu test

Chạy lần lượt để:

1. Xóa hai ảnh.
2. Xóa variant.
3. Soft delete product.
4. Kiểm tra public detail trả `404`.

Product bị soft delete vẫn còn trong database với `deleted_at` khác `NULL`, đúng
theo yêu cầu phần 06.

## 7. Chạy tự động bằng Collection Runner

Có thể chọn collection và bấm **Run collection**. Giữ nguyên thứ tự request từ
folder `00` đến `04`, vì các request sau sử dụng biến được tạo bởi request trước.

Không bật chế độ chạy song song. Collection có thao tác tạo, cập nhật và xóa dữ
liệu phụ thuộc theo tuần tự.

Nếu chạy lại sau khi lần trước bị dừng giữa chừng, request tạo product dùng hậu tố
thời gian mới nên không bị trùng SKU. Dữ liệu của lần chạy bị dừng có thể vẫn còn
và cần xóa thủ công nếu folder dọn dữ liệu chưa được chạy.

## 8. Các lỗi thường gặp

### `401 Bạn chưa đăng nhập`

- Chưa chạy `Login Admin`.
- Access token đã hết hạn.
- Biến `accessToken` chưa được lưu.

Chạy lại request `Login Admin`.

### `403 Bạn không có quyền quản trị`

Tài khoản đăng nhập có role `CUSTOMER`, không phải `ADMIN`.

### `401 Tài khoản không còn hoạt động`

Tài khoản admin đang bị `LOCKED` hoặc đã bị soft delete.

### `404 Không tìm thấy danh mục` hoặc thương hiệu

`categoryId` hoặc `brandId` không tồn tại, đã bị xóa mềm, hoặc request chuẩn bị
chưa được chạy.

### `409 Slug hoặc SKU sản phẩm đã tồn tại`

SKU hoặc slug đã tồn tại trong database, kể cả ở product đã soft delete. Chạy lại
request tạo product để collection sinh `testSuffix` mới.

### `ECONNREFUSED`

- Backend chưa chạy.
- `baseUrl` sai.
- MySQL chưa chạy hoặc `.env` sai host/cổng.

Với cấu hình hiện tại, MySQL dùng `DB_PORT=3306` và API mặc định dùng port `5000`.
