# Prompt tạo Database DDTECH cho Claude

Tôi đang xây dựng đồ án:

# XÂY DỰNG ỨNG DỤNG ĐA NỀN TẢNG MUA SẮM VÀ QUẢN LÝ CỬA HÀNG THIẾT BỊ CÔNG NGHỆ “DDTECH”

## 1. Kiến trúc hệ thống

Project có cấu trúc:

```text
DDTECH/
├── frontend/
│   ├── mobile/      # App cho khách hàng
│   └── admin/       # Web quản trị
│
├── backend/         # Node.js + Express
└── README.md
```

### Mobile

- React Native
- Expo SDK 54
- TypeScript
- React Navigation
- Axios
- Socket.io Client

### Admin Web

- React
- Vite
- TypeScript
- React Router
- Axios
- Socket.io Client

### Backend

- Node.js
- Express
- TypeScript
- Socket.io
- JWT
- bcrypt
- Prisma ORM hoặc có thể query MySQL trực tiếp sau này

### Database

- MySQL/MariaDB chạy bằng XAMPP
- Quản lý bằng phpMyAdmin
- Database tên: `ddtech`
- Charset: `utf8mb4`
- Collation phù hợp với tiếng Việt

---

# 2. Yêu cầu

Hãy thiết kế một database hoàn chỉnh cho hệ thống DDTECH.

Database phải đáp ứng các chức năng:

## Người dùng

- Đăng ký
- Đăng nhập
- JWT
- Phân quyền CUSTOMER / ADMIN
- Khóa/mở tài khoản
- Ảnh đại diện
- Số điện thoại
- Quản lý thông tin cá nhân
- Một người dùng có thể có nhiều địa chỉ giao hàng

---

## Danh mục sản phẩm

Ví dụ:

- Điện thoại
- Laptop
- PC
- CPU
- GPU
- Mainboard
- RAM
- SSD
- HDD
- Màn hình
- Bàn phím
- Chuột
- Tai nghe
- Loa
- Webcam
- Phụ kiện

Admin có thể:

- Thêm
- Sửa
- Xóa hoặc ẩn danh mục

---

## Thương hiệu

Ví dụ:

- ASUS
- MSI
- Gigabyte
- Intel
- AMD
- NVIDIA
- Logitech
- Razer
- Corsair
- Kingston
- Samsung
- Apple

Admin có thể quản lý thương hiệu.

---

# 3. Sản phẩm

Mỗi sản phẩm cần hỗ trợ:

- Tên sản phẩm
- Slug
- SKU
- Danh mục
- Thương hiệu
- Mô tả
- Thông số kỹ thuật
- Giá gốc
- Giá khuyến mãi
- Số lượng tồn kho
- Số lượng đã bán
- Trạng thái
- Sản phẩm nổi bật
- Sản phẩm mới
- Ngày tạo
- Ngày cập nhật

Vì đây là cửa hàng thiết bị công nghệ nên thông số mỗi loại sản phẩm khác nhau.

Ví dụ Mainboard:

```json
{
  "socket": "AM4",
  "chipset": "B550",
  "ram_type": "DDR4",
  "max_ram": "128GB",
  "wifi": "WiFi 6"
}
```

Điện thoại có thể là:

```json
{
  "screen": "6.7 inch",
  "ram": "8GB",
  "storage": "256GB",
  "battery": "5000mAh"
}
```

Hãy chọn phương án database hợp lý để lưu specifications.

Có thể sử dụng kiểu JSON nếu MySQL/MariaDB phiên bản phù hợp.

---

# 4. Ảnh sản phẩm

Một sản phẩm có nhiều ảnh.

Không được thiết kế kiểu:

```text
image1
image2
image3
image4
```

trong bảng `products`.

Phải tạo bảng riêng.

Cần hỗ trợ:

- nhiều ảnh cho một sản phẩm
- chọn ảnh chính
- thứ tự ảnh
- URL ảnh

---

# 5. Giỏ hàng

Mỗi người dùng có giỏ hàng.

Cần:

- `carts`
- `cart_items`

Một cart item chứa:

- product
- quantity
- ngày thêm

Phải có unique phù hợp để tránh một sản phẩm bị tạo nhiều dòng trùng trong cùng một giỏ hàng.

---

# 6. Sản phẩm yêu thích

Người dùng có thể:

- thêm sản phẩm vào yêu thích
- xóa khỏi yêu thích

Một user không được favorite cùng một sản phẩm nhiều lần.

---

# 7. Đơn hàng

Người dùng có thể:

- đặt hàng
- xem lịch sử đơn hàng
- xem chi tiết
- hủy đơn khi được phép

Trạng thái đơn hàng:

```text
PENDING
CONFIRMED
PROCESSING
SHIPPING
DELIVERED
CANCELLED
```

Đơn hàng cần lưu:

- mã đơn hàng
- user
- tên người nhận
- số điện thoại
- địa chỉ giao
- tổng tiền hàng
- phí vận chuyển
- tiền giảm giá
- tổng thanh toán
- phương thức thanh toán
- trạng thái thanh toán
- trạng thái đơn
- ghi chú
- thời gian tạo
- thời gian cập nhật

---

# 8. Order Items

Đây là yêu cầu rất quan trọng.

Không được chỉ lưu:

```text
order_id
product_id
quantity
```

Phải snapshot dữ liệu tại thời điểm mua.

Ví dụ `order_items` cần có:

- product_id
- product_name
- product_image
- sku
- price
- quantity
- subtotal

Ví dụ:

Khách mua RTX 5060 hôm nay với giá:

```text
10.000.000đ
```

Sau này Admin đổi sản phẩm thành:

```text
12.000.000đ
```

thì lịch sử đơn hàng cũ vẫn phải hiển thị:

```text
10.000.000đ
```

---

# 9. Thanh toán

Thiết kế bảng `payments` để sau này có thể hỗ trợ:

```text
COD
VNPAY
MOMO
ZALOPAY
```

Hiện tại ưu tiên COD nhưng database phải mở rộng được.

Payment status:

```text
UNPAID
PAID
FAILED
REFUNDED
```

Nếu cần, lưu:

- transaction_code
- gateway
- paid_at
- amount

---

# 10. Voucher / Promotion

Hệ thống cần có thể mở rộng:

- mã giảm giá
- giảm theo %
- giảm số tiền cố định
- giới hạn số lượt
- ngày bắt đầu
- ngày kết thúc
- giá trị đơn tối thiểu
- giảm tối đa
- trạng thái

Ví dụ:

```text
DDTECH10
Giảm 10%
Tối đa 500.000đ
Đơn tối thiểu 2.000.000đ
```

Có thể thiết kế `promotions` hoặc `coupons`.

---

# 11. Review

Khách hàng có thể đánh giá sản phẩm.

Review cần:

- user
- product
- rating từ 1 đến 5
- comment
- trạng thái
- created_at
- updated_at

Nếu hợp lý, giới hạn một người chỉ review một sản phẩm một lần.

Nếu có thể, thiết kế để sau này chỉ người đã mua hàng mới được review.

---

# 12. Notifications

Cần bảng `notifications` để kết hợp với Socket.io.

Ví dụ:

Khách đặt hàng:

```text
Mobile
↓
Backend
↓
Admin nhận:
"Có đơn hàng mới #DD00001"
```

Admin cập nhật:

```text
PENDING
↓
CONFIRMED
```

Mobile nhận:

```text
"Đơn hàng DD00001 đã được xác nhận"
```

Notification cần:

- user_id
- title
- message
- type
- reference_id nếu cần
- is_read
- created_at

---

# 13. Quản lý tồn kho

Khi đặt hàng phải có khả năng:

- kiểm tra stock
- giảm stock
- tránh stock bị âm
- tăng sold_count

Khi đơn bị hủy có thể hoàn stock tùy nghiệp vụ.

Nếu thấy cần thiết, hãy thiết kế thêm bảng `inventory_transactions` để lưu lịch sử:

```text
IMPORT
SALE
RETURN
ADJUSTMENT
CANCEL_ORDER
```

Mỗi transaction có:

- product_id
- quantity
- type
- reference_id
- note
- created_at

---

# 14. Admin Dashboard

Database phải hỗ trợ truy vấn:

- tổng doanh thu
- doanh thu theo ngày
- doanh thu theo tháng
- số đơn hàng
- số đơn theo trạng thái
- số khách hàng
- số sản phẩm
- top sản phẩm bán chạy
- sản phẩm tồn kho thấp
- đơn hàng gần đây
- doanh thu 7 ngày gần nhất

---

# 15. Yêu cầu thiết kế database

Hãy thiết kế ít nhất các bảng sau và bổ sung nếu cần:

```text
users
addresses

categories
brands

products
product_images

carts
cart_items

favorites

orders
order_items

payments

promotions

reviews

notifications

inventory_transactions
```

Nếu cần thêm bảng trung gian để chuẩn hóa dữ liệu, hãy thêm.

---

# 16. Yêu cầu SQL

Hãy tạo cho tôi một file SQL hoàn chỉnh có thể chạy trực tiếp trên:

```text
XAMPP
MySQL/MariaDB
phpMyAdmin
```

Database:

```text
ddtech
```

Bắt đầu bằng:

```sql
CREATE DATABASE IF NOT EXISTS ddtech
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ddtech;
```

Sau đó tạo toàn bộ bảng.

---

# 17. Quy tắc database

Hãy chú ý:

## Primary Key

Dùng:

```sql
BIGINT UNSIGNED AUTO_INCREMENT
```

hoặc lựa chọn hợp lý và giải thích.

## Foreign Key

Đặt rõ:

```text
FOREIGN KEY
ON DELETE
ON UPDATE
```

Không được đặt `CASCADE` bừa bãi.

Ví dụ:

Ảnh sản phẩm có thể:

```text
ON DELETE CASCADE
```

nhưng lịch sử order không được mất chỉ vì sản phẩm bị xóa.

## Monetary values

Không dùng FLOAT cho tiền.

Dùng:

```sql
DECIMAL(15,2)
```

hoặc kiểu phù hợp.

## Password

Không lưu password dạng plaintext.

Chỉ có:

```text
password_hash
```

Backend sẽ dùng bcrypt.

## Email

Email phải UNIQUE.

## Phone

Cân nhắc UNIQUE hợp lý.

## Slug

Category, Brand, Product nên có slug.

Slug cần UNIQUE khi phù hợp.

## SKU

Product SKU UNIQUE.

## Index

Hãy tạo INDEX cho những trường hay search/filter:

```text
product name
category_id
brand_id
price
status
created_at

orders.user_id
orders.status
orders.created_at

notifications.user_id
```

Không tạo index vô nghĩa.

## CHECK

Nếu database version hỗ trợ, hãy dùng constraint:

```text
price >= 0
sale_price >= 0
stock >= 0
rating BETWEEN 1 AND 5
quantity > 0
```

Nếu MariaDB/XAMPP có khác biệt thì hãy viết theo cách tương thích.

---

# 18. Soft Delete

Đối với:

```text
products
categories
brands
users
```

không nhất thiết DELETE vật lý.

Có thể dùng:

```text
status
deleted_at
```

để soft delete.

Hãy đề xuất phương án hợp lý cho hệ thống thương mại điện tử.

---

# 19. Sample Data

Sau khi tạo bảng, hãy thêm dữ liệu mẫu.

## Admin

Tạo ít nhất một tài khoản admin giả lập.

Không cần password bcrypt thật nếu không có backend, có thể ghi chú rằng password hash chỉ là dữ liệu mẫu.

## Categories

Thêm:

```text
Điện thoại
Laptop
PC
CPU
GPU
Mainboard
RAM
SSD
Màn hình
Bàn phím
Chuột
Tai nghe
```

## Brands

Thêm:

```text
ASUS
MSI
Gigabyte
Intel
AMD
NVIDIA
Logitech
Razer
Samsung
Apple
```

## Products

Tạo khoảng 8-10 sản phẩm công nghệ mẫu.

Ví dụ:

```text
ASUS TUF Gaming B550M-PLUS WIFI II
AMD Ryzen 5 5600
Intel Core i5
Logitech G304
Razer DeathAdder
Samsung SSD 980
ASUS Gaming Monitor
MSI RTX Graphics Card
```

Các dữ liệu:

- giá
- sale_price
- stock
- specifications

phải hợp lý.

---

# 20. ERD

Sau khi viết SQL, hãy mô tả ERD dạng text như:

```text
users
 ├── 1:N addresses
 ├── 1:1 carts
 ├── 1:N orders
 ├── 1:N reviews
 └── 1:N notifications

categories
 └── 1:N products

brands
 └── 1:N products

products
 ├── 1:N product_images
 ├── 1:N cart_items
 ├── 1:N order_items
 ├── 1:N reviews
 └── 1:N inventory_transactions
```

Giải thích rõ quan hệ:

```text
1:1
1:N
N:N
```

---

# 21. Sau khi tạo SQL

Hãy giải thích từng bảng.

Ví dụ:

```text
users
Dùng để lưu tài khoản khách hàng và admin.

products
Lưu thông tin chính của sản phẩm.

product_images
Quan hệ 1:N với products.

orders
Lưu thông tin chung của đơn hàng.

order_items
Snapshot sản phẩm tại thời điểm mua.
```

Giải thích ngắn gọn nhưng dễ hiểu cho sinh viên.

---

# 22. Kiểm tra thiết kế

Sau khi hoàn thành database, hãy tự review và kiểm tra:

1. Có lỗi foreign key không?
2. Thứ tự CREATE TABLE đã đúng chưa?
3. Có bảng nào tham chiếu bảng chưa được tạo không?
4. Có lỗi AUTO_INCREMENT không?
5. Có lỗi datatype MySQL/MariaDB không?
6. Có lỗi ENUM không?
7. Có lỗi JSON khi dùng MariaDB không?
8. Có lỗi DECIMAL không?
9. Có khả năng order history bị mất nếu xóa product không?
10. Có khả năng stock âm không?
11. Cart có tạo duplicate product không?
12. Favorite có duplicate không?
13. Review có duplicate không?
14. Email/SKU/slug có UNIQUE đúng chưa?
15. Index đã hợp lý chưa?

Nếu phát hiện vấn đề thì sửa trước khi đưa SQL cuối cùng.

---

# 23. Yêu cầu output

Trả lời theo đúng thứ tự:

## PHẦN 1 - Phân tích database

Giải thích ngắn gọn kiến trúc.

## PHẦN 2 - Danh sách bảng

Liệt kê toàn bộ bảng và mục đích.

## PHẦN 3 - ERD

Mô tả quan hệ giữa các bảng.

## PHẦN 4 - FULL SQL

Đưa toàn bộ SQL trong **một code block duy nhất**, để tôi copy trực tiếp vào phpMyAdmin và chạy.

Không chia SQL thành nhiều đoạn rời.

## PHẦN 5 - Dữ liệu mẫu

Đưa INSERT data mẫu.

Nếu có thể hãy để INSERT luôn trong file SQL tổng.

## PHẦN 6 - Các query kiểm tra

Cho các câu lệnh để kiểm tra:

```sql
SHOW TABLES;
```

Lấy danh sách sản phẩm kèm category, brand, ảnh chính.

Lấy giỏ hàng của user.

Lấy đơn hàng và order_items.

Lấy doanh thu.

Lấy top sản phẩm bán chạy.

Lấy sản phẩm gần hết hàng.

## PHẦN 7 - Review

Nêu các điểm cần lưu ý trước khi backend Node.js kết nối database.

---

# 24. Yêu cầu ưu tiên

Ưu tiên:

- database dễ hiểu
- phù hợp đồ án sinh viên
- không over-engineering
- chuẩn hóa hợp lý
- dễ kết nối Node.js + Express + TypeScript
- dễ chuyển sang Prisma về sau
- tương thích XAMPP / MariaDB
- có thể mở rộng thực tế

Không chỉ đưa ra ví dụ sơ sài.

Tôi cần một thiết kế đủ hoàn chỉnh để sử dụng làm database chính thức cho project DDTECH.
