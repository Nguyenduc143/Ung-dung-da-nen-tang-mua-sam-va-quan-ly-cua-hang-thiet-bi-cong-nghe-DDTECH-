-- =====================================================================
--  DDTECH - Database cho ứng dụng mua sắm & quản lý cửa hàng thiết bị công nghệ
--  Target : MySQL 8.0+ (đã test toàn bộ script trên MySQL 8.0.46, dùng JSON + CHECK constraint)
--  Cách chạy (PowerShell) - dùng "source" để giữ đúng UTF-8 tiếng Việt, KHÔNG dùng "<" hay pipe:
--    & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -P 3307 --default-character-set=utf8mb4 -e "source d:/mobiledlt/ddtechdlt/be/database/ddtech.sql"
--  Hoặc mở MySQL Workbench -> File > Open SQL Script -> Execute (Ctrl+Shift+Enter)
-- =====================================================================

-- Bỏ comment dòng dưới nếu muốn tạo lại DB từ đầu (XÓA TOÀN BỘ DỮ LIỆU CŨ)
-- DROP DATABASE IF EXISTS ddtech;

CREATE DATABASE IF NOT EXISTS ddtech
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ddtech;

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- =====================================================================
--  1. USERS & ADDRESSES
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name       VARCHAR(100)    NOT NULL,
  email           VARCHAR(150)    NOT NULL,
  phone           VARCHAR(20)     NULL,
  password_hash   VARCHAR(255)    NOT NULL,             -- bcrypt hash, KHÔNG lưu plaintext
  avatar_url      VARCHAR(500)    NULL,
  role            ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  status          ENUM('ACTIVE','LOCKED')  NOT NULL DEFAULT 'ACTIVE', -- khóa / mở tài khoản
  last_login_at   DATETIME        NULL,
  deleted_at      DATETIME        NULL,                 -- soft delete
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),                    -- NULL được phép trùng, số thật thì unique
  KEY idx_users_role_status (role, status),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  recipient_name  VARCHAR(100)    NOT NULL,
  phone           VARCHAR(20)     NOT NULL,
  province        VARCHAR(100)    NOT NULL,             -- Tỉnh / Thành phố
  district        VARCHAR(100)    NOT NULL,             -- Quận / Huyện
  ward            VARCHAR(100)    NOT NULL,             -- Phường / Xã
  street          VARCHAR(255)    NOT NULL,             -- Số nhà, tên đường
  is_default      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_addresses_user_id (user_id),
  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  2. CATEGORIES & BRANDS
-- =====================================================================

CREATE TABLE IF NOT EXISTS categories (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id       BIGINT UNSIGNED NULL,                 -- danh mục cha (tùy chọn), NULL = cấp 1
  name            VARCHAR(100)    NOT NULL,
  slug            VARCHAR(120)    NOT NULL,
  description     TEXT            NULL,
  image_url       VARCHAR(500)    NULL,
  sort_order      INT             NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,   -- ẩn / hiện danh mục
  deleted_at      DATETIME        NULL,                 -- soft delete
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent_id (parent_id),
  KEY idx_categories_active_sort (is_active, sort_order),
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100)    NOT NULL,
  slug            VARCHAR(120)    NOT NULL,
  logo_url        VARCHAR(500)    NULL,
  description     TEXT            NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  deleted_at      DATETIME        NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_slug (slug),
  UNIQUE KEY uq_brands_name (name),
  KEY idx_brands_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  3. PRODUCTS & PRODUCT_IMAGES
-- =====================================================================

CREATE TABLE IF NOT EXISTS products (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id       BIGINT UNSIGNED NOT NULL,
  brand_id          BIGINT UNSIGNED NULL,
  name              VARCHAR(255)    NOT NULL,
  slug              VARCHAR(280)    NOT NULL,
  sku               VARCHAR(50)     NOT NULL,
  short_description VARCHAR(500)    NULL,
  description       LONGTEXT        NULL,
  specifications    JSON            NULL,               -- thông số kỹ thuật, khác nhau theo loại sản phẩm
  price             DECIMAL(15,2)   NOT NULL,           -- giá gốc
  sale_price        DECIMAL(15,2)   NULL,               -- giá khuyến mãi, NULL = không giảm
  stock             INT UNSIGNED    NOT NULL DEFAULT 0, -- UNSIGNED => không thể âm
  sold_count        INT UNSIGNED    NOT NULL DEFAULT 0,
  warranty_months   SMALLINT UNSIGNED NOT NULL DEFAULT 12,
  status            ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE', -- INACTIVE = ẩn khỏi shop
  is_featured       TINYINT(1)      NOT NULL DEFAULT 0,
  is_new            TINYINT(1)      NOT NULL DEFAULT 0,
  deleted_at        DATETIME        NULL,               -- soft delete
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_name (name),
  KEY idx_products_category_id (category_id),
  KEY idx_products_brand_id (brand_id),
  KEY idx_products_price (price),
  KEY idx_products_status (status),
  KEY idx_products_created_at (created_at),
  KEY idx_products_featured (is_featured),
  KEY idx_products_sold_count (sold_count),
  FULLTEXT KEY ft_products_search (name, short_description),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,               -- không cho xóa danh mục còn sản phẩm
  CONSTRAINT fk_products_brand
    FOREIGN KEY (brand_id) REFERENCES brands(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_products_price      CHECK (price >= 0),
  CONSTRAINT chk_products_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      BIGINT UNSIGNED NOT NULL,
  image_url       VARCHAR(500)    NOT NULL,
  alt_text        VARCHAR(255)    NULL,
  is_primary      TINYINT(1)      NOT NULL DEFAULT 0,   -- ảnh chính (backend đảm bảo 1 ảnh/sản phẩm)
  sort_order      INT             NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_images_product (product_id, sort_order),
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE                 -- xóa sản phẩm => xóa ảnh
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  4. CARTS & CART_ITEMS
-- =====================================================================

CREATE TABLE IF NOT EXISTS carts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_user_id (user_id),                -- 1 user : 1 cart
  CONSTRAINT fk_carts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id         BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  quantity        INT UNSIGNED    NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_cart_product (cart_id, product_id), -- không trùng sản phẩm trong 1 giỏ
  KEY idx_cart_items_product_id (product_id),
  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,                -- sản phẩm bị xóa thì bay khỏi giỏ
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  5. FAVORITES
-- =====================================================================

CREATE TABLE IF NOT EXISTS favorites (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_user_product (user_id, product_id), -- không favorite 2 lần
  KEY idx_favorites_product_id (product_id),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_favorites_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  6. PROMOTIONS (voucher / mã giảm giá)
-- =====================================================================

CREATE TABLE IF NOT EXISTS promotions (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code              VARCHAR(50)     NOT NULL,           -- DDTECH10
  name              VARCHAR(150)    NOT NULL,
  description       TEXT            NULL,
  discount_type     ENUM('PERCENT','FIXED') NOT NULL,   -- giảm % hoặc số tiền cố định
  discount_value    DECIMAL(15,2)   NOT NULL,           -- PERCENT: 10 = 10% ; FIXED: 100000 = 100.000đ
  max_discount      DECIMAL(15,2)   NULL,               -- giảm tối đa (chủ yếu cho PERCENT), NULL = không giới hạn
  min_order_value   DECIMAL(15,2)   NOT NULL DEFAULT 0, -- giá trị đơn tối thiểu
  usage_limit       INT UNSIGNED    NULL,               -- tổng số lượt được dùng, NULL = không giới hạn
  used_count        INT UNSIGNED    NOT NULL DEFAULT 0,
  start_date        DATETIME        NOT NULL,
  end_date          DATETIME        NOT NULL,
  is_active         TINYINT(1)      NOT NULL DEFAULT 1,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotions_code (code),
  KEY idx_promotions_active_dates (is_active, start_date, end_date),
  CONSTRAINT chk_promotions_value CHECK (discount_value > 0),
  CONSTRAINT chk_promotions_percent CHECK (discount_type <> 'PERCENT' OR discount_value <= 100),
  CONSTRAINT chk_promotions_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  7. ORDERS, ORDER_ITEMS, PAYMENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS orders (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_code        VARCHAR(20)     NOT NULL,           -- DD00001 (backend sinh từ id)
  user_id           BIGINT UNSIGNED NOT NULL,
  promotion_id      BIGINT UNSIGNED NULL,
  promotion_code    VARCHAR(50)     NULL,               -- snapshot mã đã dùng
  -- snapshot địa chỉ giao hàng (không FK tới addresses vì user có thể sửa/xóa địa chỉ sau)
  recipient_name    VARCHAR(100)    NOT NULL,
  recipient_phone   VARCHAR(20)     NOT NULL,
  shipping_address  VARCHAR(500)    NOT NULL,           -- "12 Nguyễn Văn Bảo, P.4, Q.Gò Vấp, TP.HCM"
  note              TEXT            NULL,
  -- tiền
  subtotal          DECIMAL(15,2)   NOT NULL DEFAULT 0, -- tổng tiền hàng
  shipping_fee      DECIMAL(15,2)   NOT NULL DEFAULT 0,
  discount_amount   DECIMAL(15,2)   NOT NULL DEFAULT 0,
  total_amount      DECIMAL(15,2)   NOT NULL DEFAULT 0, -- = subtotal + shipping_fee - discount_amount
  -- thanh toán & trạng thái
  payment_method    ENUM('COD','VNPAY','MOMO','ZALOPAY') NOT NULL DEFAULT 'COD',
  payment_status    ENUM('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  status            ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  cancel_reason     VARCHAR(255)    NULL,
  confirmed_at      DATETIME        NULL,
  delivered_at      DATETIME        NULL,
  cancelled_at      DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (order_code),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_status (status),
  KEY idx_orders_payment_status (payment_status),
  KEY idx_orders_created_at (created_at),
  KEY idx_orders_promotion_id (promotion_id),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,               -- không xóa user còn đơn hàng (dùng soft delete)
  CONSTRAINT fk_orders_promotion
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_orders_money CHECK (subtotal >= 0 AND shipping_fee >= 0 AND discount_amount >= 0 AND total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NULL,                 -- NULL nếu sản phẩm bị xóa vật lý, lịch sử vẫn còn
  -- SNAPSHOT tại thời điểm mua
  product_name    VARCHAR(255)    NOT NULL,
  product_sku     VARCHAR(50)     NOT NULL,
  product_image   VARCHAR(500)    NULL,
  price           DECIMAL(15,2)   NOT NULL,             -- đơn giá lúc mua (đã áp dụng sale_price nếu có)
  quantity        INT UNSIGNED    NOT NULL,
  subtotal        DECIMAL(15,2)   NOT NULL,             -- = price * quantity
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,                -- item sống chết theo order
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE,               -- KHÔNG cascade: giữ lịch sử đơn
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price CHECK (price >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id          BIGINT UNSIGNED NOT NULL,
  method            ENUM('COD','VNPAY','MOMO','ZALOPAY') NOT NULL,
  status            ENUM('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  amount            DECIMAL(15,2)   NOT NULL,
  gateway           VARCHAR(50)     NULL,               -- 'vnpay', 'momo', ... (NULL với COD)
  transaction_code  VARCHAR(100)    NULL,               -- mã giao dịch từ cổng thanh toán
  gateway_response  JSON            NULL,               -- raw response của cổng để debug
  paid_at           DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_transaction_code (transaction_code),
  KEY idx_payments_order_id (order_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,               -- bảo vệ lịch sử giao dịch
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  8. REVIEWS
-- =====================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  order_id        BIGINT UNSIGNED NULL,                 -- đơn đã mua => "verified purchase"
  rating          TINYINT UNSIGNED NOT NULL,
  comment         TEXT            NULL,
  status          ENUM('PENDING','APPROVED','HIDDEN') NOT NULL DEFAULT 'APPROVED',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_product (user_id, product_id), -- 1 user review 1 sản phẩm 1 lần
  KEY idx_reviews_product_status (product_id, status),
  KEY idx_reviews_order_id (order_id),
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  9. NOTIFICATIONS (dùng chung với Socket.io)
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,             -- người nhận (customer hoặc admin)
  title           VARCHAR(255)    NOT NULL,
  message         TEXT            NOT NULL,
  type            ENUM('ORDER','PAYMENT','PROMOTION','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  reference_type  VARCHAR(50)     NULL,                 -- 'order', 'product', 'promotion'...
  reference_id    BIGINT UNSIGNED NULL,                 -- id của bản ghi liên quan (vd orders.id)
  is_read         TINYINT(1)      NOT NULL DEFAULT 0,
  read_at         DATETIME        NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read (user_id, is_read),
  KEY idx_notifications_created_at (created_at),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  10. INVENTORY_TRANSACTIONS (lịch sử xuất / nhập kho)
-- =====================================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      BIGINT UNSIGNED NOT NULL,
  type            ENUM('IMPORT','SALE','RETURN','ADJUSTMENT','CANCEL_ORDER') NOT NULL,
  quantity        INT             NOT NULL,             -- có dấu: +nhập kho, -bán ra
  stock_after     INT UNSIGNED    NOT NULL,             -- tồn kho sau giao dịch (tiện đối soát)
  reference_type  VARCHAR(50)     NULL,                 -- 'order', 'import', ...
  reference_id    BIGINT UNSIGNED NULL,                 -- vd orders.id
  note            VARCHAR(255)    NULL,
  created_by      BIGINT UNSIGNED NULL,                 -- admin thao tác (NULL nếu hệ thống tự động)
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_product_created (product_id, created_at),
  KEY idx_inventory_type (type),
  KEY idx_inventory_reference (reference_type, reference_id),
  CONSTRAINT fk_inventory_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,               -- giữ lịch sử kho, product chỉ soft delete
  CONSTRAINT fk_inventory_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_inventory_quantity CHECK (quantity <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- =====================================================================
--  SAMPLE DATA
-- =====================================================================
-- =====================================================================

-- ---------- USERS ----------
-- LƯU Ý: password_hash dưới đây CHỈ LÀ CHUỖI GIẢ đúng độ dài bcrypt, KHÔNG đăng nhập được.
-- Khi backend chạy, hãy đăng ký tài khoản mới hoặc chạy seed script (bcrypt.hash('123456', 10)) rồi UPDATE lại.
INSERT INTO users (id, full_name, email, phone, password_hash, avatar_url, role, status) VALUES
(1, 'DDTECH Admin',     'admin@ddtech.vn',     '0900000001', '$2b$10$sampleHashOnlyForSeedDataReplaceWithBcryptHashxxxxxxxxx', NULL, 'ADMIN',    'ACTIVE'),
(2, 'Nguyễn Văn An',    'an.nguyen@gmail.com', '0912345678', '$2b$10$sampleHashOnlyForSeedDataReplaceWithBcryptHashxxxxxxxxx', NULL, 'CUSTOMER', 'ACTIVE'),
(3, 'Trần Thị Bích',    'bich.tran@gmail.com', '0987654321', '$2b$10$sampleHashOnlyForSeedDataReplaceWithBcryptHashxxxxxxxxx', NULL, 'CUSTOMER', 'ACTIVE'),
(4, 'Lê Minh Cường',    'cuong.le@gmail.com',  NULL,         '$2b$10$sampleHashOnlyForSeedDataReplaceWithBcryptHashxxxxxxxxx', NULL, 'CUSTOMER', 'LOCKED');

-- ---------- ADDRESSES ----------
INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, street, is_default) VALUES
(2, 'Nguyễn Văn An',  '0912345678', 'TP. Hồ Chí Minh', 'Quận Gò Vấp',   'Phường 4',     '12 Nguyễn Văn Bảo',          1),
(2, 'Nguyễn Văn An',  '0912345678', 'TP. Hồ Chí Minh', 'Quận 1',        'Phường Bến Nghé', '45 Lê Lợi (công ty)',     0),
(3, 'Trần Thị Bích',  '0987654321', 'Hà Nội',          'Quận Cầu Giấy', 'Phường Dịch Vọng', '88 Xuân Thủy',           1);

-- ---------- CATEGORIES ----------
INSERT INTO categories (id, name, slug, sort_order) VALUES
(1,  'Điện thoại', 'dien-thoai', 1),
(2,  'Laptop',     'laptop',     2),
(3,  'PC',         'pc',         3),
(4,  'CPU',        'cpu',        4),
(5,  'GPU',        'gpu',        5),
(6,  'Mainboard',  'mainboard',  6),
(7,  'RAM',        'ram',        7),
(8,  'SSD',        'ssd',        8),
(9,  'Màn hình',   'man-hinh',   9),
(10, 'Bàn phím',   'ban-phim',   10),
(11, 'Chuột',      'chuot',      11),
(12, 'Tai nghe',   'tai-nghe',   12);

-- ---------- BRANDS ----------
INSERT INTO brands (id, name, slug) VALUES
(1,  'ASUS',     'asus'),
(2,  'MSI',      'msi'),
(3,  'Gigabyte', 'gigabyte'),
(4,  'Intel',    'intel'),
(5,  'AMD',      'amd'),
(6,  'NVIDIA',   'nvidia'),
(7,  'Logitech', 'logitech'),
(8,  'Razer',    'razer'),
(9,  'Samsung',  'samsung'),
(10, 'Apple',    'apple'),
(11, 'Kingston', 'kingston'),
(12, 'Corsair',  'corsair');

-- ---------- PRODUCTS ----------
INSERT INTO products
(id, category_id, brand_id, name, slug, sku, short_description, specifications, price, sale_price, stock, sold_count, warranty_months, status, is_featured, is_new) VALUES
(1, 6, 1,
 'ASUS TUF Gaming B550M-PLUS WIFI II', 'asus-tuf-gaming-b550m-plus-wifi-ii', 'MB-ASUS-B550M-WIFI2',
 'Mainboard AM4 chipset B550, hỗ trợ Ryzen 5000, WiFi 6, PCIe 4.0.',
 '{"socket":"AM4","chipset":"B550","form_factor":"mATX","ram_type":"DDR4","ram_slots":4,"max_ram":"128GB","m2_slots":2,"wifi":"WiFi 6","lan":"2.5GbE"}',
 3290000, 2990000, 25, 42, 36, 'ACTIVE', 1, 0),

(2, 4, 5,
 'AMD Ryzen 5 5600', 'amd-ryzen-5-5600', 'CPU-AMD-R5-5600',
 'CPU 6 nhân 12 luồng, xung tối đa 4.4GHz, socket AM4, kèm tản Wraith Stealth.',
 '{"socket":"AM4","cores":6,"threads":12,"base_clock":"3.5GHz","boost_clock":"4.4GHz","cache_l3":"32MB","tdp":"65W","igpu":false}',
 3190000, 2890000, 40, 120, 36, 'ACTIVE', 1, 0),

(3, 4, 4,
 'Intel Core i5-12400F', 'intel-core-i5-12400f', 'CPU-INTEL-I5-12400F',
 'CPU 6 nhân 12 luồng thế hệ 12, xung tối đa 4.4GHz, socket LGA1700.',
 '{"socket":"LGA1700","cores":6,"threads":12,"base_clock":"2.5GHz","boost_clock":"4.4GHz","cache_l3":"18MB","tdp":"65W","igpu":false}',
 3690000, 3390000, 30, 95, 36, 'ACTIVE', 0, 0),

(4, 11, 7,
 'Logitech G304 Lightspeed Wireless', 'logitech-g304-lightspeed', 'MOUSE-LOGI-G304',
 'Chuột gaming không dây Lightspeed, sensor HERO 12K, pin AA 250 giờ.',
 '{"connection":"Wireless 2.4GHz","sensor":"HERO","dpi_max":12000,"buttons":6,"weight":"99g","battery":"1 x AA (250h)"}',
 890000, 749000, 99, 310, 24, 'ACTIVE', 1, 0),

(5, 11, 8,
 'Razer DeathAdder V3', 'razer-deathadder-v3', 'MOUSE-RAZER-DAV3',
 'Chuột gaming có dây siêu nhẹ 59g, sensor Focus Pro 30K.',
 '{"connection":"Wired","sensor":"Focus Pro 30K","dpi_max":30000,"buttons":6,"weight":"59g","cable":"Speedflex"}',
 1990000, NULL, 35, 64, 24, 'ACTIVE', 0, 0),

(6, 8, 9,
 'Samsung SSD 980 1TB NVMe M.2', 'samsung-ssd-980-1tb', 'SSD-SS-980-1TB',
 'SSD NVMe PCIe 3.0 x4, đọc 3500MB/s, ghi 3000MB/s.',
 '{"capacity":"1TB","form_factor":"M.2 2280","interface":"PCIe 3.0 x4 NVMe","read_speed":"3500MB/s","write_speed":"3000MB/s","tbw":"600TB"}',
 1890000, 1690000, 59, 210, 60, 'ACTIVE', 1, 0),

(7, 9, 1,
 'ASUS TUF Gaming VG249Q1A 24" 165Hz', 'asus-tuf-gaming-vg249q1a', 'MON-ASUS-VG249Q1A',
 'Màn hình gaming 23.8 inch IPS Full HD 165Hz, 1ms, FreeSync Premium.',
 '{"size":"23.8 inch","panel":"IPS","resolution":"1920x1080","refresh_rate":"165Hz","response_time":"1ms MPRT","ports":["HDMI x2","DisplayPort"],"sync":"FreeSync Premium"}',
 3990000, 3590000, 18, 57, 36, 'ACTIVE', 0, 0),

(8, 5, 2,
 'MSI GeForce RTX 5060 8G VENTUS 2X OC', 'msi-geforce-rtx-5060-8g-ventus-2x-oc', 'GPU-MSI-RTX5060-8G',
 'Card đồ họa RTX 5060 8GB GDDR7, kiến trúc Blackwell, hỗ trợ DLSS 4.',
 '{"gpu":"GeForce RTX 5060","vram":"8GB GDDR7","boost_clock":"2535MHz","bus":"PCIe 5.0 x8","ports":["HDMI 2.1b","DisplayPort 2.1b x3"],"power":"145W","recommended_psu":"550W"}',
 10990000, 9990000, 12, 28, 36, 'ACTIVE', 1, 1),

(9, 6, 3,
 'Gigabyte B650M Gaming X AX', 'gigabyte-b650m-gaming-x-ax', 'MB-GB-B650M-GX-AX',
 'Mainboard AM5 chipset B650, DDR5, WiFi 6E, hỗ trợ Ryzen 7000/9000.',
 '{"socket":"AM5","chipset":"B650","form_factor":"mATX","ram_type":"DDR5","ram_slots":4,"max_ram":"192GB","m2_slots":2,"wifi":"WiFi 6E","lan":"2.5GbE"}',
 4990000, NULL, 15, 19, 36, 'ACTIVE', 0, 1),

(10, 1, 9,
 'Samsung Galaxy S25 8GB/256GB', 'samsung-galaxy-s25-8gb-256gb', 'PHONE-SS-S25-256',
 'Flagship màn hình 6.2 inch Dynamic AMOLED 2X 120Hz, Snapdragon 8 Elite.',
 '{"screen":"6.2 inch Dynamic AMOLED 2X 120Hz","chip":"Snapdragon 8 Elite for Galaxy","ram":"8GB","storage":"256GB","battery":"4000mAh","camera":"50MP + 12MP + 10MP","os":"Android 15"}',
 22990000, 19990000, 20, 33, 12, 'ACTIVE', 1, 1),

(11, 2, 10,
 'Apple MacBook Air M4 13" 16GB/256GB', 'apple-macbook-air-m4-13-16gb-256gb', 'LAP-APPLE-MBA-M4-256',
 'MacBook Air 13.6 inch chip M4, 16GB RAM, 256GB SSD, pin 18 giờ.',
 '{"screen":"13.6 inch Liquid Retina","chip":"Apple M4 (10 CPU / 8 GPU)","ram":"16GB","storage":"256GB SSD","battery":"18 giờ","weight":"1.24kg","os":"macOS"}',
 27990000, 26490000, 8, 14, 12, 'ACTIVE', 1, 1),

(12, 7, 11,
 'Kingston FURY Beast 16GB (2x8GB) DDR4 3200MHz', 'kingston-fury-beast-16gb-ddr4-3200', 'RAM-KST-FB-16-3200',
 'Kit RAM DDR4 16GB bus 3200, CL16, tản nhiệt nhôm.',
 '{"type":"DDR4","capacity":"16GB (2x8GB)","speed":"3200MHz","latency":"CL16","voltage":"1.35V"}',
 1190000, 1090000, 3, 88, 36, 'ACTIVE', 0, 0),

(13, 10, 7,
 'Logitech G213 Prodigy RGB', 'logitech-g213-prodigy', 'KB-LOGI-G213',
 'Bàn phím gaming màng RGB Lightsync, kháng nước, kê tay tích hợp.',
 '{"switch":"Mech-Dome","layout":"Full-size","backlight":"RGB Lightsync","connection":"Wired USB","anti_ghosting":true}',
 1090000, 890000, 0, 150, 24, 'ACTIVE', 0, 0),

(14, 12, 8,
 'Razer BlackShark V2 X', 'razer-blackshark-v2-x', 'HS-RAZER-BSV2X',
 'Tai nghe gaming driver 50mm TriForce, mic khử ồn, jack 3.5mm.',
 '{"driver":"50mm TriForce Titanium","connection":"3.5mm","microphone":"HyperClear Cardioid","weight":"240g","surround":"7.1 (software)"}',
 1490000, 1190000, 45, 76, 24, 'INACTIVE', 0, 0);

-- ---------- PRODUCT IMAGES ----------
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1,  '/uploads/products/asus-b550m-plus-wifi2-1.jpg',  'ASUS TUF B550M-PLUS WIFI II', 1, 0),
(1,  '/uploads/products/asus-b550m-plus-wifi2-2.jpg',  'Cổng I/O phía sau',            0, 1),
(2,  '/uploads/products/amd-r5-5600-1.jpg',            'AMD Ryzen 5 5600',             1, 0),
(3,  '/uploads/products/intel-i5-12400f-1.jpg',        'Intel Core i5-12400F',         1, 0),
(4,  '/uploads/products/logitech-g304-1.jpg',          'Logitech G304',                1, 0),
(4,  '/uploads/products/logitech-g304-2.jpg',          'Logitech G304 mặt bên',        0, 1),
(5,  '/uploads/products/razer-dav3-1.jpg',             'Razer DeathAdder V3',          1, 0),
(6,  '/uploads/products/samsung-980-1tb-1.jpg',        'Samsung SSD 980 1TB',          1, 0),
(7,  '/uploads/products/asus-vg249q1a-1.jpg',          'ASUS VG249Q1A',                1, 0),
(8,  '/uploads/products/msi-rtx5060-ventus-1.jpg',     'MSI RTX 5060 VENTUS 2X',       1, 0),
(8,  '/uploads/products/msi-rtx5060-ventus-2.jpg',     'MSI RTX 5060 backplate',       0, 1),
(9,  '/uploads/products/gigabyte-b650m-gx-ax-1.jpg',   'Gigabyte B650M Gaming X AX',   1, 0),
(10, '/uploads/products/galaxy-s25-1.jpg',             'Samsung Galaxy S25',           1, 0),
(11, '/uploads/products/macbook-air-m4-1.jpg',         'MacBook Air M4',               1, 0),
(12, '/uploads/products/kingston-fury-beast-1.jpg',    'Kingston FURY Beast DDR4',     1, 0),
(13, '/uploads/products/logitech-g213-1.jpg',          'Logitech G213',                1, 0),
(14, '/uploads/products/razer-blackshark-v2x-1.jpg',   'Razer BlackShark V2 X',        1, 0);

-- ---------- PROMOTIONS ----------
INSERT INTO promotions (id, code, name, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, used_count, start_date, end_date, is_active) VALUES
(1, 'DDTECH10',  'Giảm 10% toàn shop',        'Giảm 10%, tối đa 500.000đ cho đơn từ 2.000.000đ', 'PERCENT', 10,     500000, 2000000, 1000, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(2, 'FREESHIP',  'Miễn phí vận chuyển',       'Giảm 30.000đ phí ship cho đơn từ 500.000đ',       'FIXED',   30000,  NULL,   500000,  NULL, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(3, 'NEWUSER50', 'Chào mừng khách hàng mới',  'Giảm 50.000đ cho đơn đầu tiên từ 300.000đ',       'FIXED',   50000,  NULL,   300000,  500,  0, '2026-01-01 00:00:00', '2026-06-30 23:59:59', 0);

-- ---------- CARTS ----------
INSERT INTO carts (id, user_id) VALUES (1, 2), (2, 3);

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 2, 1),   -- An: Ryzen 5 5600
(1, 1, 1),   -- An: B550M
(1, 12, 2),  -- An: 2 kit RAM
(2, 10, 1);  -- Bích: Galaxy S25

-- ---------- FAVORITES ----------
INSERT INTO favorites (user_id, product_id) VALUES
(2, 8), (2, 11), (3, 4), (3, 10);

-- ---------- ORDERS ----------
-- Đơn 1: An mua RTX 5060 + G304, dùng DDTECH10 (10% = 1.073.900 -> cap 500.000), đã giao, COD đã thu tiền
INSERT INTO orders (id, order_code, user_id, promotion_id, promotion_code, recipient_name, recipient_phone, shipping_address, note,
                    subtotal, shipping_fee, discount_amount, total_amount, payment_method, payment_status, status,
                    confirmed_at, delivered_at, created_at) VALUES
(1, 'DD00001', 2, 1, 'DDTECH10', 'Nguyễn Văn An', '0912345678', '12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh', 'Giao giờ hành chính',
 10739000, 30000, 500000, 10269000, 'COD', 'PAID', 'DELIVERED',
 '2026-09-02 09:15:00', '2026-09-04 16:40:00', '2026-09-02 08:30:00');

-- Đơn 2: Bích mua SSD 980, đang chờ xác nhận
INSERT INTO orders (id, order_code, user_id, recipient_name, recipient_phone, shipping_address,
                    subtotal, shipping_fee, discount_amount, total_amount, payment_method, payment_status, status, created_at) VALUES
(2, 'DD00002', 3, 'Trần Thị Bích', '0987654321', '88 Xuân Thủy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
 1690000, 30000, 0, 1720000, 'COD', 'UNPAID', 'PENDING', '2026-09-09 20:05:00');

-- Đơn 3: An mua G213 nhưng hủy
INSERT INTO orders (id, order_code, user_id, recipient_name, recipient_phone, shipping_address,
                    subtotal, shipping_fee, discount_amount, total_amount, payment_method, payment_status, status,
                    cancel_reason, cancelled_at, created_at) VALUES
(3, 'DD00003', 2, 'Nguyễn Văn An', '0912345678', '45 Lê Lợi (công ty), Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
 890000, 30000, 0, 920000, 'COD', 'UNPAID', 'CANCELLED',
 'Khách đổi ý', '2026-09-06 10:00:00', '2026-09-06 09:20:00');

-- ---------- ORDER ITEMS (snapshot giá tại thời điểm mua) ----------
INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_image, price, quantity, subtotal) VALUES
(1, 8, 'MSI GeForce RTX 5060 8G VENTUS 2X OC', 'GPU-MSI-RTX5060-8G', '/uploads/products/msi-rtx5060-ventus-1.jpg', 9990000, 1, 9990000),
(1, 4, 'Logitech G304 Lightspeed Wireless',     'MOUSE-LOGI-G304',    '/uploads/products/logitech-g304-1.jpg',      749000,  1, 749000),
(2, 6, 'Samsung SSD 980 1TB NVMe M.2',          'SSD-SS-980-1TB',     '/uploads/products/samsung-980-1tb-1.jpg',    1690000, 1, 1690000),
(3, 13, 'Logitech G213 Prodigy RGB',            'KB-LOGI-G213',       '/uploads/products/logitech-g213-1.jpg',      890000,  1, 890000);

-- ---------- PAYMENTS ----------
INSERT INTO payments (order_id, method, status, amount, gateway, transaction_code, paid_at) VALUES
(1, 'COD', 'PAID',   10269000, NULL, NULL, '2026-09-04 16:40:00'),
(2, 'COD', 'UNPAID', 1720000,  NULL, NULL, NULL);

-- ---------- INVENTORY TRANSACTIONS ----------
INSERT INTO inventory_transactions (product_id, type, quantity, stock_after, reference_type, reference_id, note, created_by, created_at) VALUES
(8,  'IMPORT',       15, 15, 'import', NULL, 'Nhập lô RTX 5060 đầu tiên',      1, '2026-08-25 10:00:00'),
(8,  'SALE',         -1, 14, 'order',  1,    'Bán theo đơn DD00001',            NULL, '2026-09-02 08:30:00'),
(4,  'SALE',         -1, 99, 'order',  1,    'Bán theo đơn DD00001',            NULL, '2026-09-02 08:30:00'),
(6,  'SALE',         -1, 59, 'order',  2,    'Bán theo đơn DD00002',            NULL, '2026-09-09 20:05:00'),
(13, 'SALE',         -1, 0,  'order',  3,    'Bán theo đơn DD00003',            NULL, '2026-09-06 09:20:00'),
(13, 'CANCEL_ORDER',  1, 1,  'order',  3,    'Hoàn kho do hủy đơn DD00003',     1, '2026-09-06 10:00:00'),
(13, 'ADJUSTMENT',   -1, 0,  NULL,     NULL, 'Kiểm kho: 1 sản phẩm lỗi, loại',  1, '2026-09-07 09:00:00'),
(8,  'ADJUSTMENT',   -2, 12, NULL,     NULL, 'Kiểm kho: điều chỉnh thực tế',    1, '2026-09-08 09:00:00');

-- ---------- REVIEWS ----------
INSERT INTO reviews (user_id, product_id, order_id, rating, comment, status) VALUES
(2, 8, 1, 5, 'Card chạy mát, chơi game 1080p max setting rất mượt. Giao hàng nhanh.', 'APPROVED'),
(2, 4, 1, 4, 'Chuột nhẹ, pin trâu. Hơi nhỏ với tay to.', 'APPROVED'),
(3, 6, NULL, 5, 'Tốc độ đúng như quảng cáo, giá tốt.', 'APPROVED');

-- ---------- NOTIFICATIONS ----------
INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id, is_read, read_at, created_at) VALUES
(1, 'Có đơn hàng mới #DD00001', 'Nguyễn Văn An vừa đặt đơn DD00001 trị giá 10.269.000đ', 'ORDER', 'order', 1, 1, '2026-09-02 09:10:00', '2026-09-02 08:30:00'),
(2, 'Đơn hàng DD00001 đã được xác nhận', 'Cửa hàng đã xác nhận đơn hàng của bạn và đang chuẩn bị hàng.', 'ORDER', 'order', 1, 1, '2026-09-02 09:30:00', '2026-09-02 09:15:00'),
(2, 'Đơn hàng DD00001 đã giao thành công', 'Cảm ơn bạn đã mua sắm tại DDTECH! Hãy đánh giá sản phẩm nhé.', 'ORDER', 'order', 1, 1, '2026-09-04 18:00:00', '2026-09-04 16:40:00'),
(1, 'Có đơn hàng mới #DD00002', 'Trần Thị Bích vừa đặt đơn DD00002 trị giá 1.720.000đ', 'ORDER', 'order', 2, 0, NULL, '2026-09-09 20:05:00'),
(1, 'Có đơn hàng mới #DD00003', 'Nguyễn Văn An vừa đặt đơn DD00003 trị giá 920.000đ', 'ORDER', 'order', 3, 1, '2026-09-06 09:25:00', '2026-09-06 09:20:00'),
(2, 'Đơn hàng DD00003 đã bị hủy', 'Đơn hàng DD00003 đã được hủy theo yêu cầu của bạn.', 'ORDER', 'order', 3, 1, '2026-09-06 10:05:00', '2026-09-06 10:00:00'),
(2, 'Mã giảm giá DDTECH10', 'Giảm 10% tối đa 500.000đ cho đơn từ 2.000.000đ. Áp dụng đến 31/12/2026.', 'PROMOTION', 'promotion', 1, 0, NULL, '2026-09-01 08:00:00'),
(3, 'Mã giảm giá DDTECH10', 'Giảm 10% tối đa 500.000đ cho đơn từ 2.000.000đ. Áp dụng đến 31/12/2026.', 'PROMOTION', 'promotion', 1, 0, NULL, '2026-09-01 08:00:00');

-- =====================================================================
--  END
-- =====================================================================
