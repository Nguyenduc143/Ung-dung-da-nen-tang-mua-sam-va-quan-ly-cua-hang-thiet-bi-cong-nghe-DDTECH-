# Kết luận thiết kế Database DDTECH

Tài liệu tổng kết cho database `ddtech` (file `be/database/ddtech.sql`) của đồ án
**Xây dựng ứng dụng đa nền tảng mua sắm và quản lý cửa hàng thiết bị công nghệ "DDTECH"**.

- Hệ quản trị: **MySQL Server 8.0** (đã kiểm thử toàn bộ script trên MySQL 8.0.46)
- Charset / Collation: `utf8mb4` / `utf8mb4_unicode_ci`
- Số bảng: **16**
- Cổng MySQL trên máy dev hiện tại: **3307** (không phải 3306 mặc định)

---

## 1. Tóm tắt kiến trúc

| Nhóm | Bảng | Ghi chú |
|---|---|---|
| Người dùng | `users`, `addresses` | Phân quyền `CUSTOMER / ADMIN`, khóa tài khoản qua `status`, nhiều địa chỉ giao hàng |
| Danh mục | `categories`, `brands` | `slug` UNIQUE, có `is_active` để ẩn/hiện, `deleted_at` để soft delete |
| Sản phẩm | `products`, `product_images` | Thông số kỹ thuật lưu cột `JSON`, ảnh tách bảng riêng với `is_primary`, `sort_order` |
| Mua sắm | `carts`, `cart_items`, `favorites` | 1 user – 1 cart, chống trùng bằng `UNIQUE (cart_id, product_id)` và `UNIQUE (user_id, product_id)` |
| Đơn hàng | `orders`, `order_items`, `payments`, `promotions` | `order_items` snapshot tên / SKU / ảnh / giá tại thời điểm mua |
| Tương tác | `reviews`, `notifications` | 1 user chỉ review 1 sản phẩm 1 lần; `notifications` dùng chung với Socket.io |
| Kho | `inventory_transactions` | Lịch sử `IMPORT / SALE / RETURN / ADJUSTMENT / CANCEL_ORDER`, có `stock_after` để đối soát |

### Quyết định thiết kế chính

1. **Khóa chính**: `BIGINT UNSIGNED AUTO_INCREMENT` cho mọi bảng, kể cả bảng trung gian. Tính duy nhất nghiệp vụ đảm bảo bằng `UNIQUE KEY` tổ hợp. Cách này đơn giản, dễ map sang Prisma.
2. **Tiền tệ**: `DECIMAL(15,2)`, không dùng `FLOAT/DOUBLE`.
3. **Thông số kỹ thuật**: cột `specifications JSON` trong `products`. Mỗi loại sản phẩm có bộ key khác nhau (mainboard: socket/chipset, điện thoại: screen/ram/battery…). Truy vấn bằng `specifications->>'$.socket'`. Không tách bảng EAV để tránh over-engineering.
4. **Snapshot đơn hàng**: `order_items` lưu `product_name, product_sku, product_image, price, quantity, subtotal`; `orders` lưu snapshot người nhận, địa chỉ và `promotion_code`. Admin đổi giá sau này không ảnh hưởng lịch sử.
5. **Soft delete**: `users`, `categories`, `brands`, `products` có `deleted_at` + `status / is_active`. Không hard-delete các bảng này trong nghiệp vụ thực tế.
6. **Foreign key có chủ đích**, không CASCADE bừa bãi:

   | Quan hệ | ON DELETE | Lý do |
   |---|---|---|
   | `products` → `product_images`, `cart_items`, `favorites`, `reviews` | `CASCADE` | Dữ liệu phụ thuộc, không có giá trị lịch sử |
   | `products` → `order_items` | `SET NULL` | Giữ lịch sử đơn, chỉ mất liên kết |
   | `products` → `inventory_transactions` | `RESTRICT` | Không cho xóa sản phẩm đã có lịch sử kho |
   | `users` → `orders` | `RESTRICT` | User có đơn hàng chỉ được soft delete |
   | `categories` → `products` | `RESTRICT` | Không xóa danh mục còn sản phẩm |
   | `brands` → `products` | `SET NULL` | Sản phẩm vẫn tồn tại khi mất thương hiệu |
   | `orders` → `order_items` | `CASCADE` | Item sống chết theo đơn |
   | `orders` → `payments` | `RESTRICT` | Bảo vệ lịch sử giao dịch |

7. **Chống stock âm** ở hai lớp: `stock INT UNSIGNED` (MySQL từ chối trừ quá) + backend `UPDATE ... WHERE stock >= ?` trong transaction.
8. **CHECK constraint** (MySQL 8.0.16+ enforce thật): `price >= 0`, `sale_price <= price`, `quantity > 0`, `rating BETWEEN 1 AND 5`, `discount_value <= 100` với PERCENT, `end_date > start_date`.
9. **Index** đặt đúng chỗ hay lọc / sắp xếp: `products(name, category_id, brand_id, price, status, created_at, is_featured, sold_count)` + `FULLTEXT(name, short_description)`; `orders(user_id, status, payment_status, created_at)`; `notifications(user_id, is_read)`.

---

## 2. Kết quả kiểm thử

Script được chạy trên một instance MySQL 8.0.46 tạm, kết quả:

| Kiểm tra | Kết quả |
|---|---|
| Chạy toàn bộ file, thứ tự `CREATE TABLE`, khóa ngoại, AUTO_INCREMENT, ENUM, JSON, DECIMAL | Không lỗi, 16 bảng, dữ liệu mẫu đầy đủ |
| Tiếng Việt lưu đúng UTF-8 (`Điện thoại` = 10 ký tự / 15 byte) | Đúng |
| Thêm trùng sản phẩm trong cùng giỏ | Bị chặn (`1062 Duplicate entry`) |
| Favorite trùng, review trùng, email trùng | Bị chặn |
| `rating = 6`, `sale_price > price`, voucher `PERCENT > 100` | Bị `CHECK` chặn |
| Trừ stock nhiều hơn tồn kho | Bị lỗi `UNSIGNED out of range` |
| Xóa category còn sản phẩm, xóa user còn đơn | Bị `RESTRICT` chặn |
| Hard-delete sản phẩm đã có trong đơn | `order_items.product_id` → `NULL`, tên/giá/ảnh vẫn giữ nguyên |
| Truy vấn JSON `specifications->>'$.socket'` | Hoạt động |
| Các query dashboard (doanh thu, top bán chạy, tồn kho thấp…) | Trả kết quả đúng với dữ liệu mẫu |

---

## 3. Lưu ý trước khi backend Node.js kết nối

1. **Đặt hàng phải nằm trong một transaction**
   - Trừ kho bằng `UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ? AND stock >= ?`; nếu `affectedRows = 0` → rollback, báo hết hàng.
   - Insert `orders` → `order_items` (copy `name / sku / ảnh / giá` từ `products` tại thời điểm đó) → `payments` → `inventory_transactions (SALE)` → `notifications` cho admin → emit Socket.io.
2. **Hủy đơn**: chỉ cho phép khi `status IN ('PENDING','CONFIRMED')`; hoàn stock, giảm `sold_count`, ghi `inventory_transactions (CANCEL_ORDER)`, gửi notification cho khách.
3. **Mã đơn hàng**: sinh sau khi có `insertId`: `'DD' + String(id).padStart(5, '0')` → `DD00001`.
4. **Ảnh chính**: DB không ép "chỉ 1 `is_primary` / sản phẩm"; khi set ảnh chính, backend phải reset các ảnh khác của sản phẩm về `0`.
5. **Voucher**: kiểm tra `is_active`, `start_date <= NOW() <= end_date`, `subtotal >= min_order_value`, `used_count < usage_limit`; tính giảm giá (PERCENT thì cap theo `max_discount`), rồi `used_count + 1` trong cùng transaction với đơn.
6. **Review**: chỉ cho phép khi user có `order_items` của sản phẩm đó trong đơn `DELIVERED`; gán `order_id` vào review để đánh dấu "đã mua".
7. **Soft delete**: mọi query phía shop thêm `WHERE deleted_at IS NULL AND status = 'ACTIVE'`; admin không hard-delete `products / users / categories / brands`.
8. **Kết nối `mysql2/promise`**:
   ```ts
   mysql.createPool({
     host: 'localhost',
     port: 3307,
     user: 'root',
     password: process.env.DB_PASSWORD,
     database: 'ddtech',
     charset: 'utf8mb4',
     timezone: '+07:00',
     decimalNumbers: true, // DECIMAL trả về number thay vì string
     waitForConnections: true,
     connectionLimit: 10,
   });
   ```
9. **Prisma**: `npx prisma db pull` introspect được toàn bộ schema (ENUM, JSON, composite unique đều map được).
10. **Tài khoản admin mẫu**: `password_hash` trong file SQL chỉ là chuỗi giả. Sau khi chạy script, tạo hash thật bằng `bcrypt.hash('123456', 10)` và `UPDATE users SET password_hash = ? WHERE id = 1`.
11. **Chạy script trên Windows/PowerShell**: dùng `source` để giữ đúng UTF-8, không dùng `<` hoặc pipe:
    ```powershell
    & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -P 3307 --default-character-set=utf8mb4 -e "source d:/mobiledlt/ddtechdlt/be/database/ddtech.sql"
    ```

---

## 4. Hướng mở rộng (chưa làm để tránh over-engineering)

- `order_status_history`: lưu từng lần đổi trạng thái đơn (ai đổi, lúc nào).
- `refresh_tokens`: quản lý JWT refresh token, cho phép đăng xuất từ xa.
- `product_variants`: nếu một sản phẩm có nhiều phiên bản (màu, dung lượng) với giá / tồn kho riêng.
- `promotion_usages`: giới hạn số lần dùng voucher theo từng user.
- `shipping_methods`: nhiều phương thức vận chuyển với phí khác nhau.
- `banners`: quản lý banner trang chủ cho mobile app.
- Cột `rating_avg`, `review_count` trong `products` (denormalize) khi cần tối ưu tốc độ danh sách sản phẩm.
