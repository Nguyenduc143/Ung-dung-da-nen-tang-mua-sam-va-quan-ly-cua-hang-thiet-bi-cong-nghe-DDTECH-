# DDTECH – Thiết kế Database

> Đồ án: **Xây dựng ứng dụng đa nền tảng mua sắm và quản lý cửa hàng thiết bị công nghệ "DDTECH"**
>
> - Hệ quản trị: **MySQL 8.0+** (đã kiểm tra tương thích với MySQL 8.0.46 đang cài trên máy)
> - Database: `ddtech` – charset `utf8mb4` – collation `utf8mb4_unicode_ci`
> - File SQL đầy đủ (schema + trigger + dữ liệu mẫu): [`ddtech.sql`](./ddtech.sql)

---

## Mục lục

1. [Phần 1 – Phân tích database](#phần-1--phân-tích-database)
2. [Phần 2 – Danh sách bảng và mục đích](#phần-2--danh-sách-bảng-và-mục-đích)
3. [Phần 3 – ERD](#phần-3--erd)
4. [Phần 4 & 5 – Chạy file SQL và dữ liệu mẫu](#phần-4--5--chạy-file-sql-và-dữ-liệu-mẫu)
5. [Phần 6 – Các query kiểm tra](#phần-6--các-query-kiểm-tra)
6. [Phần 7 – Lưu ý trước khi kết nối backend Node.js](#phần-7--lưu-ý-trước-khi-kết-nối-backend-nodejs)
7. [Checklist tự review thiết kế](#checklist-tự-review-thiết-kế)

---

## Phần 1 – Phân tích database

### 1.1. Bức tranh tổng thể

Hệ thống có 3 client dùng chung 1 backend và 1 database:

```text
Mobile (React Native)  ─┐
                        ├──► Backend Node.js + Express + Socket.io ──► MySQL 8 (ddtech)
Admin Web (React/Vite) ─┘
```

Database được chia thành 7 nhóm nghiệp vụ, tổng cộng **23 bảng**:

| Nhóm | Bảng | Vai trò |
|---|---|---|
| Người dùng | `users`, `refresh_tokens`, `addresses` | Tài khoản, JWT, sổ địa chỉ |
| Danh mục | `categories`, `brands`, `category_attributes` | Phân loại sản phẩm, khung thông số |
| Sản phẩm | `products`, `product_variants`, `product_images` | Sản phẩm, phiên bản, ảnh |
| Mua sắm | `carts`, `cart_items`, `favorites` | Giỏ hàng, yêu thích |
| Bán hàng | `shipping_methods`, `promotions`, `orders`, `order_items`, `order_status_history`, `payments`, `promotion_usages` | Đặt hàng, thanh toán, khuyến mãi |
| Tương tác | `reviews`, `notifications` | Đánh giá, thông báo realtime |
| Vận hành | `inventory_transactions`, `banners` | Lịch sử kho, banner trang chủ |

### 1.2. Các quyết định thiết kế quan trọng

| Vấn đề | Quyết định | Lý do |
|---|---|---|
| Primary key | `BIGINT UNSIGNED AUTO_INCREMENT` | Không âm, đủ lớn, Prisma map thẳng sang `BigInt`/`Int` |
| Tiền | `DECIMAL(15,2)` | Không dùng FLOAT để tránh sai số; đủ cho 9.999.999.999.999,99 đ |
| Thông số kỹ thuật | Cột `products.specifications` kiểu **JSON** + bảng `category_attributes` mô tả "khung" | Mỗi danh mục có thông số khác nhau (Mainboard ≠ Điện thoại). JSON linh hoạt, `category_attributes` giúp Admin render form và Mobile render bộ lọc mà không hard-code |
| Ảnh sản phẩm | Bảng riêng `product_images` (`is_primary`, `sort_order`) | Không dùng image1..image4 trong `products` |
| Order items | **Snapshot** `product_name`, `product_sku`, `product_image`, `original_price`, `price`; `product_id` cho phép NULL (`ON DELETE SET NULL`) | Đổi giá/xóa sản phẩm không làm sai lịch sử đơn |
| Địa chỉ giao hàng trong đơn | Snapshot text vào `orders` (không FK sang `addresses`) | Khách sửa/xóa địa chỉ không ảnh hưởng đơn cũ |
| Tồn kho âm | `stock INT UNSIGNED` + backend `UPDATE ... WHERE stock >= ?` | MySQL từ chối giá trị âm ở mức DB |
| Trùng sản phẩm trong giỏ | `UNIQUE (cart_id, product_id, variant_key)` với `variant_key = IFNULL(variant_id, 0)` (generated column) | MySQL coi các NULL là khác nhau trong UNIQUE, nên phải quy NULL về 0 |
| Soft delete | `status` + `deleted_at` cho `users`, `products`, `categories`, `brands` | Dữ liệu tham chiếu (đơn hàng, kho) không bị mất |
| Mã đơn hàng | `orders.order_code` dạng `DD00001`, trigger tự sinh nếu backend để trống | Dễ đọc, dễ tra cứu qua điện thoại |
| Xóa dây chuyền | `CASCADE` chỉ cho dữ liệu "thuộc về" cha (ảnh, giỏ hàng, token...). Đơn hàng dùng `RESTRICT`/`SET NULL` | Không mất lịch sử bán hàng |

### 1.3. Quy tắc FK áp dụng

- `ON DELETE CASCADE`: `product_images`, `product_variants`, `cart_items`, `favorites`, `addresses`, `refresh_tokens`, `notifications`, `reviews`, `order_items`, `payments`, `order_status_history`, `promotion_usages` – con mất theo cha là hợp lý.
- `ON DELETE SET NULL`: `order_items.product_id`, `order_items.variant_id`, `orders.promotion_id`, `orders.shipping_method_id`, `products.brand_id`, `categories.parent_id`, các cột `created_by/changed_by` – giữ lại bản ghi, chỉ mất liên kết.
- `ON DELETE RESTRICT`: `orders.user_id`, `products.category_id`, `inventory_transactions.product_id` – chặn xóa cứng khi còn dữ liệu quan trọng phụ thuộc (phải soft delete).
- Tất cả FK đều `ON UPDATE CASCADE`.

---

## Phần 2 – Danh sách bảng và mục đích

### Nhóm người dùng

**`users`** – Lưu tài khoản khách hàng và admin trong cùng 1 bảng, phân biệt bằng `role` (`CUSTOMER`/`ADMIN`). `status = LOCKED` khi admin khóa tài khoản. Chỉ lưu `password_hash` (bcrypt). `email` và `phone` UNIQUE.

**`refresh_tokens`** – Lưu hash của refresh token JWT theo từng thiết bị đăng nhập, cho phép đăng xuất/thu hồi token. Access token không lưu DB.

**`addresses`** – Sổ địa chỉ giao hàng, 1 user nhiều địa chỉ, có `is_default`.

### Nhóm danh mục

**`categories`** – Danh mục sản phẩm (Điện thoại, Laptop, CPU, GPU...). Có `parent_id` để mở rộng danh mục con, `slug` UNIQUE, `status` để ẩn/hiện, `deleted_at` soft delete.

**`brands`** – Thương hiệu (ASUS, MSI, Intel...). Cấu trúc tương tự categories.

**`category_attributes`** – Định nghĩa các thông số kỹ thuật mà một danh mục cần có. Ví dụ danh mục Mainboard có `socket`, `chipset`, `ram_type`... Giá trị thực của từng sản phẩm nằm trong `products.specifications` (JSON) với key trùng `attr_key`. `is_filterable = 1` để Mobile hiển thị trong bộ lọc.

### Nhóm sản phẩm

**`products`** – Thông tin chính của sản phẩm: tên, slug, SKU, danh mục, thương hiệu, mô tả, `specifications` (JSON), giá gốc, giá KM, tồn kho, đã bán, nổi bật, mới, trạng thái. Có cột denormalized `rating_avg`, `review_count` để list nhanh không cần JOIN reviews.

**`product_variants`** – Phiên bản của sản phẩm (dung lượng, màu). Chỉ dùng khi `products.has_variants = 1`. Mỗi variant có SKU, giá, tồn kho riêng. Khi đó `products.price` là "giá từ" và `products.stock` = tổng stock các variant (backend đồng bộ).

**`product_images`** – Quan hệ 1:N với products. Nhiều ảnh, `is_primary` đánh dấu ảnh chính, `sort_order` để sắp thứ tự. Có thể gắn ảnh riêng cho variant qua `variant_id`.

### Nhóm mua sắm

**`carts`** – Mỗi user đúng 1 giỏ hàng (`user_id` UNIQUE).

**`cart_items`** – Sản phẩm trong giỏ: product, variant (nếu có), quantity, ngày thêm. UNIQUE `(cart_id, product_id, variant_key)` chống trùng dòng.

**`favorites`** – Bảng trung gian N:N giữa users và products. UNIQUE `(user_id, product_id)`.

### Nhóm bán hàng

**`shipping_methods`** – Phương thức vận chuyển (Tiêu chuẩn, Nhanh) với phí cơ bản và ngưỡng miễn phí.

**`promotions`** – Mã giảm giá: giảm `%` hoặc số tiền cố định, giảm tối đa, đơn tối thiểu, giới hạn tổng lượt và lượt/người, ngày bắt đầu/kết thúc, trạng thái.

**`orders`** – Thông tin chung của đơn: mã đơn, user, người nhận, địa chỉ (snapshot), phương thức vận chuyển, mã KM (snapshot), tiền hàng, phí ship, giảm giá, tổng thanh toán, phương thức và trạng thái thanh toán, trạng thái đơn, ghi chú, các mốc thời gian.

**`order_items`** – Snapshot sản phẩm tại thời điểm mua: tên, SKU, ảnh, tên phiên bản, giá gốc, giá bán, số lượng. `subtotal` là generated column `= price * quantity`. `product_id` có thể NULL nếu sản phẩm bị xóa cứng.

**`order_status_history`** – Lịch sử chuyển trạng thái đơn (từ → đến, ai đổi, lúc nào). Dùng cho timeline trên Mobile và audit ở Admin.

**`payments`** – Giao dịch thanh toán của đơn: COD/VNPAY/MOMO/ZALOPAY, trạng thái UNPAID/PAID/FAILED/REFUNDED, số tiền, mã giao dịch, JSON raw từ cổng thanh toán, thời điểm thanh toán. 1 đơn có thể có nhiều payment (thanh toán lại khi FAILED, refund).

**`promotion_usages`** – Ghi lại mỗi lần một user dùng mã cho một đơn, phục vụ kiểm tra `usage_limit` và `usage_limit_per_user`.

### Nhóm tương tác

**`reviews`** – Đánh giá sản phẩm: rating 1–5, comment, ảnh (JSON), phản hồi của admin, trạng thái duyệt. UNIQUE `(user_id, product_id)`. Cột `order_id` + `is_verified_purchase` để chỉ cho người đã mua (đơn DELIVERED) mới review.

**`notifications`** – Thông báo cho từng user, kết hợp Socket.io. `type` (ORDER/PAYMENT/PROMOTION/REVIEW/SYSTEM), `reference_type` + `reference_id` để bấm vào mở đúng màn hình, `is_read`.

### Nhóm vận hành

**`inventory_transactions`** – Lịch sử biến động tồn kho: IMPORT / SALE / RETURN / ADJUSTMENT / CANCEL_ORDER. `quantity` dương là tăng kho, âm là giảm; `stock_after` là tồn sau giao dịch để đối soát.

**`banners`** – Banner trang chủ Mobile: ảnh, loại liên kết (sản phẩm/danh mục/URL), vị trí, thời gian hiển thị.

---

## Phần 3 – ERD

### 3.1. Sơ đồ quan hệ dạng text

```text
users
 ├── 1:N refresh_tokens
 ├── 1:N addresses
 ├── 1:1 carts
 ├── 1:N favorites            (N:N với products qua bảng favorites)
 ├── 1:N orders
 ├── 1:N reviews
 ├── 1:N notifications
 ├── 1:N promotion_usages
 ├── 1:N order_status_history  (changed_by)
 └── 1:N inventory_transactions (created_by)

categories
 ├── 1:N categories           (parent_id → danh mục con)
 ├── 1:N category_attributes
 └── 1:N products

brands
 └── 1:N products

products
 ├── 1:N product_variants
 ├── 1:N product_images
 ├── 1:N cart_items
 ├── 1:N favorites
 ├── 1:N order_items          (product_id nullable – snapshot)
 ├── 1:N reviews
 └── 1:N inventory_transactions

product_variants
 ├── 1:N product_images       (variant_id nullable)
 ├── 1:N cart_items           (variant_id nullable)
 ├── 1:N order_items          (variant_id nullable)
 └── 1:N inventory_transactions (variant_id nullable)

carts
 └── 1:N cart_items

shipping_methods
 └── 1:N orders

promotions
 ├── 1:N orders               (promotion_id nullable)
 └── 1:N promotion_usages

orders
 ├── 1:N order_items
 ├── 1:N order_status_history
 ├── 1:N payments
 ├── 1:N promotion_usages
 └── 1:N reviews              (order_id nullable – đơn đã mua)
```

### 3.2. Giải thích các loại quan hệ

| Loại | Ví dụ | Cách thể hiện trong DB |
|---|---|---|
| **1:1** | `users` – `carts` | FK `carts.user_id` + `UNIQUE`. Mỗi user đúng 1 giỏ. |
| **1:N** | `products` – `product_images` | FK `product_images.product_id`. 1 sản phẩm nhiều ảnh, 1 ảnh thuộc 1 sản phẩm. |
| **N:N** | `users` – `products` (yêu thích) | Bảng trung gian `favorites(user_id, product_id)` + UNIQUE cặp khóa. Tương tự: `promotions` – `users` qua `promotion_usages`; `orders` – `products` qua `order_items` (kèm snapshot). |
| **Tự tham chiếu** | `categories.parent_id → categories.id` | Danh mục cha/con, `ON DELETE SET NULL`. |

---

## Phần 4 & 5 – Chạy file SQL và dữ liệu mẫu

### 4.1. Cách chạy

**Cách 1 – phpMyAdmin**: mở tab **SQL**, dán toàn bộ nội dung [`ddtech.sql`](./ddtech.sql), bấm **Go**. phpMyAdmin hiểu lệnh `DELIMITER` nên trigger tạo bình thường.

**Cách 2 – dòng lệnh** (PowerShell, MySQL 8 cài tại đường dẫn mặc định):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < D:\mobiledlt\ddtechdlt\ddtech.sql
```

Lưu ý:

- Script **DROP toàn bộ bảng** của `ddtech` rồi tạo lại, chạy lại nhiều lần được trong môi trường dev. Không chạy trên DB có dữ liệu thật.
- Không chạy file này qua `mysql2` trong Node.js (`multipleStatements`) vì `DELIMITER` là lệnh của client, driver không hiểu. Chỉ chạy qua phpMyAdmin / mysql CLI / MySQL Workbench.
- Nếu XAMPP của bạn thực ra là **MariaDB** (mặc định XAMPP ship MariaDB 10.4): cột `JSON` sẽ là alias của `LONGTEXT` (vẫn chạy), nhưng `FULLTEXT ... WITH PARSER ngram` và `CHECK` phức tạp có thể báo lỗi. Bạn hãy báo lại để tôi xuất bản MariaDB.

### 4.2. Tài khoản mẫu

| Email | Mật khẩu | Role | Trạng thái |
|---|---|---|---|
| `admin@ddtech.vn` | `Admin@123` | ADMIN | ACTIVE |
| `an.nguyen@gmail.com` | `User@123` | CUSTOMER | ACTIVE |
| `binh.tran@gmail.com` | `User@123` | CUSTOMER | ACTIVE |
| `cuong.le@gmail.com` | `User@123` | CUSTOMER | **LOCKED** (để test khóa tài khoản) |

Hash trong DB là bcrypt thật (cost 10, prefix `$2b$`), `bcrypt.compare()` hoặc `bcryptjs.compare()` trên Node.js đều trả `true`.

### 4.3. Dữ liệu mẫu có gì

| Bảng | Số dòng | Ghi chú |
|---|---|---|
| categories | 13 | Điện thoại → Phụ kiện |
| brands | 12 | ASUS, MSI, Gigabyte, Intel, AMD, NVIDIA, Logitech, Razer, Samsung, Apple, Kingston, Corsair |
| category_attributes | 50 | Khung thông số cho 9 danh mục |
| products | 12 | Mainboard, CPU ×2, Chuột ×2, SSD, Màn hình, GPU, Điện thoại ×2, RAM, Laptop |
| product_variants | 4 | Galaxy S25 (256/512GB), iPhone 16 (128/256GB) |
| product_images | 21 | Mỗi sản phẩm 1–3 ảnh, 1 ảnh chính (placehold.co để app hiển thị được ngay) |
| shipping_methods | 2 | STANDARD (30k, free từ 2 triệu), EXPRESS (60k) |
| promotions | 4 | `DDTECH10` (10%, tối đa 500k, đơn từ 2 triệu), `FREESHIP30`, `WELCOME50K`, `SUMMER2026` (đã hết hạn) |
| orders | 5 | DD00001–DD00005, đủ trạng thái DELIVERED / CONFIRMED / PENDING / CANCELLED, COD và VNPAY |
| order_items | 9 | Snapshot giá, có 1 dòng mua variant |
| order_status_history | 15 | Timeline từng đơn |
| payments | 5 | COD + VNPAY (có `transaction_code`, `gateway_response` JSON) |
| promotion_usages | 3 | Khớp `used_count` của promotions |
| inventory_transactions | 24 | IMPORT → SALE → CANCEL_ORDER; `stock_after` khớp tồn kho hiện tại |
| reviews | 4 | Của 2 đơn DELIVERED, có 1 admin_reply; khớp `rating_avg`/`review_count` |
| carts / cart_items | 3 / 3 | Có dòng chọn variant |
| favorites | 4 | |
| notifications | 8 | Cho admin và khách, đọc/chưa đọc |
| banners | 3 | |

---

## Phần 6 – Các query kiểm tra

### 6.1. Kiểm tra cấu trúc

```sql
USE ddtech;
SHOW TABLES;                          -- 23 bảng
SHOW TRIGGERS;                        -- trg_orders_before_insert
SHOW CREATE TABLE order_items\G       -- xem generated column subtotal
```

### 6.2. Danh sách sản phẩm kèm category, brand, ảnh chính

```sql
SELECT p.id, p.name, p.slug, p.sku,
       c.name  AS category_name,
       b.name  AS brand_name,
       p.price, p.sale_price,
       COALESCE(p.sale_price, p.price) AS final_price,
       p.stock, p.sold_count, p.rating_avg, p.review_count,
       pi.image_url AS primary_image
FROM products p
JOIN categories c        ON c.id = p.category_id
LEFT JOIN brands b       ON b.id = p.brand_id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

Lọc theo thông số kỹ thuật trong JSON (ví dụ mainboard socket AM4):

```sql
SELECT id, name, specifications->>'$.socket' AS socket, specifications->>'$.chipset' AS chipset
FROM products
WHERE category_id = 6
  AND specifications->>'$.socket' = 'AM4';
```

Tìm kiếm full-text (ngram, hỗ trợ tiếng Việt):

```sql
SELECT id, name, MATCH(name, short_description) AGAINST ('ryzen' IN NATURAL LANGUAGE MODE) AS score
FROM products
WHERE MATCH(name, short_description) AGAINST ('ryzen' IN NATURAL LANGUAGE MODE)
ORDER BY score DESC;
```

Chi tiết 1 sản phẩm kèm variants và tất cả ảnh:

```sql
SELECT p.id, p.name, p.has_variants, p.specifications,
       v.id AS variant_id, v.variant_name, v.price AS variant_price, v.sale_price AS variant_sale_price, v.stock AS variant_stock
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id AND v.status = 'ACTIVE'
WHERE p.slug = 'samsung-galaxy-s25';

SELECT image_url, is_primary, sort_order, variant_id
FROM product_images
WHERE product_id = 9
ORDER BY is_primary DESC, sort_order;
```

### 6.3. Giỏ hàng của user

```sql
SELECT ci.id AS cart_item_id,
       p.id AS product_id, p.name, p.slug,
       v.id AS variant_id, v.variant_name,
       ci.quantity,
       COALESCE(v.sale_price, v.price, p.sale_price, p.price) AS unit_price,
       ci.quantity * COALESCE(v.sale_price, v.price, p.sale_price, p.price) AS line_total,
       COALESCE(v.stock, p.stock) AS available_stock,
       pi.image_url AS image
FROM carts c
JOIN cart_items ci          ON ci.cart_id = c.id
JOIN products p             ON p.id = ci.product_id
LEFT JOIN product_variants v ON v.id = ci.variant_id
LEFT JOIN product_images pi  ON pi.product_id = p.id AND pi.is_primary = 1
WHERE c.user_id = 2
ORDER BY ci.created_at DESC;
```

### 6.4. Đơn hàng và order_items

Lịch sử đơn của 1 user:

```sql
SELECT o.id, o.order_code, o.status, o.payment_method, o.payment_status,
       o.subtotal, o.shipping_fee, o.discount_amount, o.total_amount,
       o.created_at,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
FROM orders o
WHERE o.user_id = 2
ORDER BY o.created_at DESC;
```

Chi tiết 1 đơn (giá là giá lúc mua, không phải giá hiện tại):

```sql
SELECT o.order_code, o.status, o.receiver_name, o.receiver_phone, o.shipping_address,
       oi.product_name, oi.variant_name, oi.product_sku, oi.product_image,
       oi.original_price, oi.price, oi.quantity, oi.subtotal
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.order_code = 'DD00001';
```

Timeline trạng thái + thanh toán của đơn:

```sql
SELECT h.from_status, h.to_status, u.full_name AS changed_by, h.note, h.created_at
FROM order_status_history h
LEFT JOIN users u ON u.id = h.changed_by
WHERE h.order_id = 1
ORDER BY h.created_at;

SELECT method, status, amount, transaction_code, paid_at FROM payments WHERE order_id = 5;
```

### 6.5. Doanh thu (Dashboard)

Quy ước: **doanh thu = tổng `total_amount` của đơn không bị hủy** (`status <> 'CANCELLED'`). Nếu muốn chặt hơn chỉ tính đơn đã giao, đổi điều kiện thành `status = 'DELIVERED'`.

```sql
-- Tổng doanh thu
SELECT SUM(total_amount) AS total_revenue
FROM orders
WHERE status <> 'CANCELLED';

-- Doanh thu theo ngày
SELECT DATE(created_at) AS ngay, COUNT(*) AS so_don, SUM(total_amount) AS doanh_thu
FROM orders
WHERE status <> 'CANCELLED'
GROUP BY DATE(created_at)
ORDER BY ngay DESC;

-- Doanh thu theo tháng
SELECT DATE_FORMAT(created_at, '%Y-%m') AS thang, COUNT(*) AS so_don, SUM(total_amount) AS doanh_thu
FROM orders
WHERE status <> 'CANCELLED'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY thang DESC;

-- Doanh thu 7 ngày gần nhất (đủ 7 dòng, ngày không có đơn = 0)
WITH RECURSIVE days AS (
  SELECT CURDATE() - INTERVAL 6 DAY AS d
  UNION ALL
  SELECT d + INTERVAL 1 DAY FROM days WHERE d < CURDATE()
)
SELECT days.d AS ngay,
       COUNT(o.id)                 AS so_don,
       IFNULL(SUM(o.total_amount), 0) AS doanh_thu
FROM days
LEFT JOIN orders o ON DATE(o.created_at) = days.d AND o.status <> 'CANCELLED'
GROUP BY days.d
ORDER BY days.d;
```

### 6.6. Thống kê tổng quan Dashboard

```sql
SELECT
  (SELECT COUNT(*) FROM orders)                                   AS total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'PENDING')          AS pending_orders,
  (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER' AND deleted_at IS NULL) AS total_customers,
  (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL)        AS total_products,
  (SELECT IFNULL(SUM(total_amount),0) FROM orders WHERE status <> 'CANCELLED') AS total_revenue;

-- Số đơn theo trạng thái
SELECT status, COUNT(*) AS so_don, SUM(total_amount) AS gia_tri
FROM orders
GROUP BY status;

-- Đơn hàng gần đây
SELECT o.order_code, u.full_name, o.total_amount, o.status, o.payment_status, o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id
ORDER BY o.created_at DESC
LIMIT 10;
```

### 6.7. Top sản phẩm bán chạy

```sql
-- Cách 1: nhanh, dùng cột denormalized
SELECT id, name, sold_count, COALESCE(sale_price, price) AS final_price
FROM products
WHERE deleted_at IS NULL
ORDER BY sold_count DESC
LIMIT 5;

-- Cách 2: chính xác theo đơn thực tế (có thể lọc theo khoảng thời gian)
SELECT oi.product_id, oi.product_name,
       SUM(oi.quantity) AS so_luong_ban,
       SUM(oi.subtotal) AS doanh_thu
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status <> 'CANCELLED'
  AND o.created_at >= '2026-08-01'
GROUP BY oi.product_id, oi.product_name
ORDER BY so_luong_ban DESC
LIMIT 5;
```

### 6.8. Sản phẩm gần hết hàng

```sql
-- Sản phẩm thường (không có variant)
SELECT id, name, sku, stock
FROM products
WHERE has_variants = 0 AND stock <= 5 AND status = 'ACTIVE' AND deleted_at IS NULL
ORDER BY stock ASC;

-- Từng phiên bản của sản phẩm có variant
SELECT p.name, v.variant_name, v.sku, v.stock
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE v.stock <= 5 AND v.status = 'ACTIVE'
ORDER BY v.stock ASC;
```

### 6.9. Đối soát tồn kho với lịch sử kho

```sql
-- Tổng biến động theo inventory_transactions phải bằng stock hiện tại
SELECT p.id, p.name, p.stock,
       SUM(t.quantity) AS stock_theo_lich_su,
       p.stock - SUM(t.quantity) AS lech
FROM products p
JOIN inventory_transactions t ON t.product_id = p.id AND t.variant_id IS NULL
WHERE p.has_variants = 0
GROUP BY p.id, p.name, p.stock
HAVING lech <> 0;   -- không trả dòng nào = dữ liệu khớp
```

### 6.10. Kiểm tra ràng buộc hoạt động (mong đợi báo lỗi)

```sql
-- Trùng sản phẩm trong giỏ -> Duplicate entry
INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (1, 3, NULL, 1);

-- Rating ngoài 1..5 -> Check constraint violated
INSERT INTO reviews (user_id, product_id, rating) VALUES (3, 1, 6);

-- Stock âm -> Out of range value
UPDATE products SET stock = stock - 100 WHERE id = 12;

-- Mã đơn tự sinh (để order_code trống) -> DD00006
INSERT INTO orders (user_id, receiver_name, receiver_phone, shipping_address, subtotal, total_amount)
VALUES (3, 'Trần Thị Bình', '0912345678', '45 Láng Hạ, Hà Nội', 100000, 130000);
SELECT id, order_code FROM orders ORDER BY id DESC LIMIT 1;
DELETE FROM orders WHERE order_code = 'DD00006';   -- dọn dữ liệu test
```

---

## Phần 7 – Lưu ý trước khi kết nối backend Node.js

### 7.1. Kết nối

- `mysql2/promise` với pool:

  ```ts
  import mysql from 'mysql2/promise';
  export const pool = mysql.createPool({
    host: 'localhost', port: 3306, user: 'root', password: '...', database: 'ddtech',
    waitForConnections: true, connectionLimit: 10,
    charset: 'utf8mb4_unicode_ci',
    timezone: '+07:00',       // DATETIME không có timezone -> thống nhất VN
    decimalNumbers: true,     // DECIMAL trả về number thay vì string
    supportBigNumbers: true,
  });
  ```

- Prisma: `DATABASE_URL="mysql://root:password@localhost:3306/ddtech"` rồi `npx prisma db pull` để sinh schema từ DB có sẵn. Prisma sẽ:
  - map `BIGINT UNSIGNED` → `BigInt` (JSON.stringify không serialize được BigInt, cần convert sang `Number`/`String` khi trả API, hoặc đổi `@db.UnsignedBigInt` thành `Int @db.UnsignedInt` trong schema nếu muốn đơn giản);
  - map `DECIMAL` → `Decimal` (dùng `.toNumber()`), `JSON` → `Json`, `TINYINT(1)` → `Boolean`, `ENUM` → enum Prisma;
  - đọc được generated column (`cart_items.variant_key`, `order_items.subtotal`) dưới dạng `@default(dbgenerated(...))`, không cần truyền khi `create`;
  - không quản lý trigger, nhưng trigger vẫn chạy bình thường khi insert qua Prisma.

### 7.2. Luồng đặt hàng (bắt buộc dùng transaction)

```text
BEGIN
 1. Lấy cart_items của user, khóa dòng sản phẩm: SELECT ... FOR UPDATE
 2. Với từng item: kiểm tra stock (product hoặc variant) >= quantity
 3. Tính subtotal (dùng COALESCE(sale_price, price) tại thời điểm này)
 4. Kiểm tra mã KM (status, start/end, min_order_value, usage_limit,
    COUNT(promotion_usages WHERE user_id) < usage_limit_per_user)
    -> discount = PERCENT ? MIN(subtotal*value/100, max_discount) : value
 5. Tính shipping_fee: subtotal >= free_threshold ? 0 : base_fee
 6. INSERT orders (order_code để '' -> trigger tự sinh, hoặc backend tự sinh)
 7. INSERT order_items với snapshot tên/SKU/ảnh/giá
 8. Giảm kho: UPDATE products SET stock = stock - ?, sold_count = sold_count + ?
              WHERE id = ? AND stock >= ?   -> kiểm tra affectedRows = 1
    (variant: UPDATE product_variants tương tự, rồi cập nhật products.stock = SUM(variants.stock))
 9. INSERT inventory_transactions (type = SALE, quantity âm, stock_after)
10. INSERT payments (COD: UNPAID; VNPAY/MOMO: UNPAID -> callback đổi PAID)
11. INSERT promotion_usages + UPDATE promotions SET used_count = used_count + 1
12. INSERT order_status_history (NULL -> PENDING)
13. DELETE cart_items đã đặt
14. INSERT notifications cho từng admin + emit Socket.io
COMMIT
```

### 7.3. Hủy đơn và hoàn kho

- Khách chỉ được hủy khi `status IN ('PENDING','CONFIRMED')`; admin hủy được ở mọi trạng thái trước `DELIVERED`.
- Khi hủy: `UPDATE orders SET status='CANCELLED', cancelled_at=NOW(), cancel_reason=?`, hoàn kho `stock = stock + qty`, `sold_count = sold_count - qty`, ghi `inventory_transactions` type `CANCEL_ORDER`, ghi `order_status_history`, nếu đã PAID online thì tạo `payments` mới với status `REFUNDED`.

### 7.4. Review

- Trước khi cho review: kiểm tra tồn tại `orders o JOIN order_items oi` với `o.user_id = ? AND oi.product_id = ? AND o.status = 'DELIVERED'`. Lưu `order_id` và `is_verified_purchase = 1`.
- Sau khi insert/update/xóa review: cập nhật lại `products.rating_avg = AVG(rating)`, `review_count = COUNT(*)` với `status = 'APPROVED'`.

### 7.5. Soft delete và UNIQUE

- Mọi query phía cửa hàng phải thêm `deleted_at IS NULL` (và `status = 'ACTIVE'`).
- `email`, `slug`, `sku` vẫn UNIQUE kể cả với bản ghi đã soft delete. Nếu khách xóa tài khoản rồi đăng ký lại cùng email sẽ bị trùng: hoặc cho admin "khôi phục", hoặc khi soft delete đổi email thành `old_email#deleted_<id>`.

### 7.6. Notifications + Socket.io

- Luôn **insert vào `notifications` trước**, rồi mới `io.to('user:<id>').emit('notification', row)`. Khi app mở lại sẽ gọi API `GET /notifications` lấy từ DB nên không mất thông báo khi offline.
- Admin: join room `admins`; khi có đơn mới, backend insert 1 dòng cho mỗi user có `role = 'ADMIN'` rồi emit vào room.

### 7.7. Một số điểm kỹ thuật khác

- `password_hash` dùng bcrypt cost 10–12; hash mẫu prefix `$2b$` tương thích cả `bcrypt` và `bcryptjs`.
- Mã đơn: trigger sinh `DD` + `LPAD(MAX(id)+1, 5)`. Nếu 2 đơn insert cùng lúc có thể trùng và 1 đơn lỗi `Duplicate entry` → backend bắt lỗi và retry 1 lần, hoặc tự sinh mã ở backend (`DD` + timestamp + random) rồi truyền vào.
- Sản phẩm có variant: `products.price/sale_price` là giá của variant rẻ nhất, `products.stock` là tổng stock. Backend phải cập nhật lại các cột này mỗi khi variant thay đổi.
- Ảnh mẫu dùng `placehold.co`. Khi có upload thật, lưu đường dẫn tương đối `/uploads/products/xxx.jpg` và serve static bằng Express.
- Nên có index bổ sung khi dữ liệu lớn: `orders(user_id, created_at)` nếu trang lịch sử đơn chậm. Hiện tại giữ tối giản theo yêu cầu.

---

## Checklist tự review thiết kế

| # | Câu hỏi | Kết quả |
|---|---|---|
| 1 | Có lỗi foreign key không? | Không. Mọi FK trỏ tới PK `BIGINT UNSIGNED` cùng kiểu, có `ON DELETE`/`ON UPDATE` rõ ràng. |
| 2 | Thứ tự CREATE TABLE đúng chưa? | Đúng: users → refresh_tokens, addresses → categories → brands → category_attributes → products → product_variants → product_images → carts → cart_items → favorites → shipping_methods → promotions → orders → order_items → order_status_history → payments → promotion_usages → reviews → notifications → inventory_transactions → banners. |
| 3 | Có bảng tham chiếu bảng chưa tạo không? | Không. `categories.parent_id` tự tham chiếu là hợp lệ. |
| 4 | Lỗi AUTO_INCREMENT? | Không. Mỗi bảng 1 cột `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`. |
| 5 | Lỗi datatype MySQL? | Không. Dùng `JSON`, `DECIMAL(15,2)`, `DATETIME`, `TINYINT(1)`, `ENUM` chuẩn MySQL 8. |
| 6 | Lỗi ENUM? | Không. Giá trị ENUM trong INSERT khớp định nghĩa (đã rà từng dòng). |
| 7 | Lỗi JSON? | Không với MySQL 8 (JSON native, `JSON_OBJECT`/`JSON_ARRAY`). Với MariaDB cần chỉnh (xem 4.1). |
| 8 | Lỗi DECIMAL? | Không. Tất cả giá trị tiền dạng `xxx.00`, `sale_price <= price` được CHECK. |
| 9 | Order history mất khi xóa product? | Không. `order_items.product_id ON DELETE SET NULL` + snapshot tên/SKU/ảnh/giá. |
| 10 | Stock có thể âm? | Không. `stock INT UNSIGNED` → MySQL báo lỗi out-of-range; backend dùng `WHERE stock >= ?`. |
| 11 | Cart duplicate product? | Không. `UNIQUE (cart_id, product_id, variant_key)`, `variant_key = IFNULL(variant_id, 0)`. |
| 12 | Favorite duplicate? | Không. `UNIQUE (user_id, product_id)`. |
| 13 | Review duplicate? | Không. `UNIQUE (user_id, product_id)`. |
| 14 | Email/SKU/slug UNIQUE? | `users.email`, `users.phone`, `products.sku`, `products.slug`, `product_variants.sku`, `categories.slug`, `brands.slug`, `promotions.code`, `orders.order_code`, `shipping_methods.code`, `payments.transaction_code`, `refresh_tokens.token_hash` đều UNIQUE. |
| 15 | Index hợp lý? | Index đúng các cột lọc/sắp xếp: `products(category_id, brand_id, price, status, created_at, sold_count, is_featured)`, FULLTEXT `(name, short_description)`, `orders(user_id, status, created_at, payment_status)`, `notifications(user_id, is_read)`, `reviews(product_id, status)`, `inventory_transactions(product_id, created_at)`. Không index cột không dùng để lọc. |
| 16 | Dữ liệu mẫu nhất quán? | `orders.total = subtotal + shipping_fee - discount` đúng cho 5 đơn; `promotions.used_count` = số dòng `promotion_usages`; `products.stock`/`sold_count` khớp `inventory_transactions` (query 6.9 trả 0 dòng); `rating_avg`/`review_count` khớp `reviews`. |
