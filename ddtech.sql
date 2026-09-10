-- =====================================================================
--  DDTECH - Database chính thức
--  Ứng dụng đa nền tảng mua sắm & quản lý cửa hàng thiết bị công nghệ
--
--  Mục tiêu : MySQL 8.x (đã kiểm tra cú pháp với MySQL 8.0)
--  Charset  : utf8mb4 / utf8mb4_unicode_ci
--  Cách chạy: mở phpMyAdmin -> tab SQL -> paste toàn bộ file -> Go
--             hoặc: mysql -u root -p < ddtech.sql
--
--  Nội dung:
--    1. Tạo database
--    2. Xoá bảng cũ (nếu chạy lại trên DB dev)
--    3. Tạo bảng (đúng thứ tự phụ thuộc khoá ngoại)
--    4. Trigger sinh mã đơn hàng DD00001
--    5. Dữ liệu mẫu
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ddtech
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ddtech;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 2. XOÁ BẢNG CŨ (chỉ dùng khi chạy lại trên môi trường dev)
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS promotion_usages;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS shipping_methods;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS category_attributes;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 3. TẠO BẢNG
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3.1 users : tài khoản khách hàng và admin
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(100)    NOT NULL,
  email          VARCHAR(191)    NOT NULL,
  phone          VARCHAR(20)     NULL,
  password_hash  VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash, KHÔNG lưu plaintext',
  avatar_url     VARCHAR(500)    NULL,
  gender         ENUM('MALE','FEMALE','OTHER') NULL,
  date_of_birth  DATE            NULL,
  role           ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  status         ENUM('ACTIVE','LOCKED')  NOT NULL DEFAULT 'ACTIVE' COMMENT 'LOCKED = admin khoá tài khoản',
  last_login_at  DATETIME        NULL,
  deleted_at     DATETIME        NULL COMMENT 'Soft delete',
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tài khoản người dùng (CUSTOMER / ADMIN)';

-- ---------------------------------------------------------------------
-- 3.2 refresh_tokens : lưu refresh token JWT (đăng nhập nhiều thiết bị, logout)
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255)    NOT NULL COMMENT 'SHA-256 của refresh token, không lưu token gốc',
  user_agent  VARCHAR(255)    NULL,
  ip_address  VARCHAR(45)     NULL,
  expires_at  DATETIME        NOT NULL,
  revoked_at  DATETIME        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  KEY idx_refresh_tokens_user (user_id),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Refresh token JWT theo thiết bị';

-- ---------------------------------------------------------------------
-- 3.3 addresses : sổ địa chỉ giao hàng (1 user - N địa chỉ)
-- ---------------------------------------------------------------------
CREATE TABLE addresses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  receiver_name   VARCHAR(100)    NOT NULL,
  receiver_phone  VARCHAR(20)     NOT NULL,
  province        VARCHAR(100)    NOT NULL,
  district        VARCHAR(100)    NOT NULL,
  ward            VARCHAR(100)    NULL,
  address_line    VARCHAR(255)    NOT NULL COMMENT 'Số nhà, tên đường',
  address_type    ENUM('HOME','OFFICE','OTHER') NOT NULL DEFAULT 'HOME',
  is_default      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_addresses_user (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Địa chỉ giao hàng của người dùng';

-- ---------------------------------------------------------------------
-- 3.4 categories : danh mục sản phẩm (hỗ trợ danh mục cha/con qua parent_id)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id    BIGINT UNSIGNED NULL COMMENT 'NULL = danh mục gốc',
  name         VARCHAR(100)    NOT NULL,
  slug         VARCHAR(120)    NOT NULL,
  description  VARCHAR(500)    NULL,
  image_url    VARCHAR(500)    NULL,
  sort_order   INT             NOT NULL DEFAULT 0,
  status       ENUM('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  deleted_at   DATETIME        NULL COMMENT 'Soft delete',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  KEY idx_categories_status (status),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục sản phẩm';

-- ---------------------------------------------------------------------
-- 3.5 brands : thương hiệu
-- ---------------------------------------------------------------------
CREATE TABLE brands (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)    NOT NULL,
  slug         VARCHAR(120)    NOT NULL,
  logo_url     VARCHAR(500)    NULL,
  description  VARCHAR(500)    NULL,
  status       ENUM('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  deleted_at   DATETIME        NULL COMMENT 'Soft delete',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_slug (slug),
  KEY idx_brands_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thương hiệu';

-- ---------------------------------------------------------------------
-- 3.6 category_attributes : định nghĩa các thông số kỹ thuật của từng danh mục
--     (Mainboard có socket/chipset..., Điện thoại có screen/ram/...)
--     Giá trị thực tế của từng sản phẩm nằm trong products.specifications (JSON),
--     key của JSON = attr_key. Bảng này dùng để admin render form nhập
--     và mobile render bộ lọc, KHÔNG lưu giá trị sản phẩm để tránh 2 nguồn dữ liệu.
-- ---------------------------------------------------------------------
CREATE TABLE category_attributes (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id    BIGINT UNSIGNED NOT NULL,
  attr_key       VARCHAR(50)     NOT NULL COMMENT 'Key trong products.specifications, vd: socket',
  attr_name      VARCHAR(100)    NOT NULL COMMENT 'Tên hiển thị, vd: Socket',
  unit           VARCHAR(20)     NULL     COMMENT 'Đơn vị, vd: GB, Hz, inch',
  input_type     ENUM('TEXT','NUMBER','SELECT') NOT NULL DEFAULT 'TEXT',
  options        JSON            NULL     COMMENT 'Danh sách lựa chọn khi input_type = SELECT',
  is_filterable  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = hiển thị trong bộ lọc',
  sort_order     INT             NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_attributes (category_id, attr_key),
  CONSTRAINT fk_category_attributes_category FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mẫu thông số kỹ thuật theo danh mục';

-- ---------------------------------------------------------------------
-- 3.7 products : sản phẩm
--     - specifications: JSON, key theo category_attributes.attr_key
--     - has_variants = 1: giá/tồn kho thực nằm ở product_variants,
--       products.price/sale_price = giá thấp nhất ("Giá từ ..."),
--       products.stock = tổng stock các variant (backend đồng bộ).
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id        BIGINT UNSIGNED NOT NULL,
  brand_id           BIGINT UNSIGNED NULL,
  name               VARCHAR(255)    NOT NULL,
  slug               VARCHAR(280)    NOT NULL,
  sku                VARCHAR(50)     NOT NULL,
  short_description  VARCHAR(500)    NULL,
  description        TEXT            NULL,
  specifications     JSON            NULL COMMENT 'Thông số kỹ thuật, vd {"socket":"AM4","chipset":"B550"}',
  price              DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Giá gốc (VND)',
  sale_price         DECIMAL(15,2)   NULL COMMENT 'Giá khuyến mãi, NULL = không KM',
  stock              INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'UNSIGNED => không thể âm',
  sold_count         INT UNSIGNED    NOT NULL DEFAULT 0,
  has_variants       TINYINT(1)      NOT NULL DEFAULT 0,
  warranty_months    SMALLINT UNSIGNED NOT NULL DEFAULT 12,
  weight_gram        INT UNSIGNED    NULL,
  rating_avg         DECIMAL(2,1)    NOT NULL DEFAULT 0.0 COMMENT 'Denormalize từ reviews',
  review_count       INT UNSIGNED    NOT NULL DEFAULT 0  COMMENT 'Denormalize từ reviews',
  view_count         INT UNSIGNED    NOT NULL DEFAULT 0,
  is_featured        TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Sản phẩm nổi bật',
  is_new             TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Sản phẩm mới',
  status             ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'INACTIVE = ẩn khỏi cửa hàng',
  deleted_at         DATETIME        NULL COMMENT 'Soft delete',
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category_id),
  KEY idx_products_brand (brand_id),
  KEY idx_products_price (price),
  KEY idx_products_status (status),
  KEY idx_products_created (created_at),
  KEY idx_products_sold (sold_count),
  KEY idx_products_featured (is_featured),
  FULLTEXT KEY ft_products_search (name, short_description) WITH PARSER ngram,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_products_price      CHECK (price >= 0),
  CONSTRAINT chk_products_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price)),
  CONSTRAINT chk_products_rating     CHECK (rating_avg >= 0 AND rating_avg <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sản phẩm';

-- ---------------------------------------------------------------------
-- 3.8 product_variants : phiên bản sản phẩm (128GB/256GB, màu sắc...)
-- ---------------------------------------------------------------------
CREATE TABLE product_variants (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id    BIGINT UNSIGNED NOT NULL,
  sku           VARCHAR(50)     NOT NULL,
  variant_name  VARCHAR(150)    NOT NULL COMMENT 'vd: 256GB - Xanh Navy',
  attributes    JSON            NULL     COMMENT 'vd: {"storage":"256GB","color":"Xanh Navy"}',
  price         DECIMAL(15,2)   NOT NULL,
  sale_price    DECIMAL(15,2)   NULL,
  stock         INT UNSIGNED    NOT NULL DEFAULT 0,
  sold_count    INT UNSIGNED    NOT NULL DEFAULT 0,
  image_url     VARCHAR(500)    NULL,
  sort_order    INT             NOT NULL DEFAULT 0,
  status        ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_variants_sku (sku),
  KEY idx_product_variants_product (product_id),
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_product_variants_price      CHECK (price >= 0),
  CONSTRAINT chk_product_variants_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phiên bản (variant) của sản phẩm';

-- ---------------------------------------------------------------------
-- 3.9 product_images : ảnh sản phẩm (1 sản phẩm - N ảnh)
-- ---------------------------------------------------------------------
CREATE TABLE product_images (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  BIGINT UNSIGNED NOT NULL,
  variant_id  BIGINT UNSIGNED NULL COMMENT 'Ảnh riêng cho variant (tuỳ chọn)',
  image_url   VARCHAR(500)    NOT NULL,
  alt_text    VARCHAR(255)    NULL,
  is_primary  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Ảnh chính (backend đảm bảo mỗi sản phẩm chỉ 1 ảnh chính)',
  sort_order  INT             NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_images_product (product_id, sort_order),
  KEY idx_product_images_variant (variant_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_images_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ảnh sản phẩm';

-- ---------------------------------------------------------------------
-- 3.10 carts : giỏ hàng (1 user - 1 giỏ)
-- ---------------------------------------------------------------------
CREATE TABLE carts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_user (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Giỏ hàng';

-- ---------------------------------------------------------------------
-- 3.11 cart_items : sản phẩm trong giỏ
--      variant_key = IFNULL(variant_id, 0) để UNIQUE hoạt động cả khi
--      variant_id NULL (MySQL coi NULL != NULL trong UNIQUE).
-- ---------------------------------------------------------------------
CREATE TABLE cart_items (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id      BIGINT UNSIGNED NOT NULL,
  product_id   BIGINT UNSIGNED NOT NULL,
  variant_id   BIGINT UNSIGNED NULL,
  variant_key  BIGINT UNSIGNED GENERATED ALWAYS AS (IFNULL(variant_id, 0)) STORED,
  quantity     INT UNSIGNED    NOT NULL DEFAULT 1,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày thêm vào giỏ',
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items (cart_id, product_id, variant_key),
  KEY idx_cart_items_product (product_id),
  KEY idx_cart_items_variant (variant_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết giỏ hàng';

-- ---------------------------------------------------------------------
-- 3.12 favorites : sản phẩm yêu thích (N:N users - products)
-- ---------------------------------------------------------------------
CREATE TABLE favorites (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_user_product (user_id, product_id),
  KEY idx_favorites_product (product_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sản phẩm yêu thích';

-- ---------------------------------------------------------------------
-- 3.13 shipping_methods : phương thức vận chuyển
-- ---------------------------------------------------------------------
CREATE TABLE shipping_methods (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                VARCHAR(30)     NOT NULL,
  name                VARCHAR(100)    NOT NULL,
  description         VARCHAR(255)    NULL,
  base_fee            DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  free_threshold      DECIMAL(15,2)   NULL COMMENT 'Miễn phí ship khi tiền hàng >= giá trị này (NULL = không miễn phí)',
  estimated_days_min  TINYINT UNSIGNED NOT NULL DEFAULT 2,
  estimated_days_max  TINYINT UNSIGNED NOT NULL DEFAULT 5,
  sort_order          INT             NOT NULL DEFAULT 0,
  status              ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipping_methods_code (code),
  CONSTRAINT chk_shipping_methods_fee CHECK (base_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phương thức vận chuyển';

-- ---------------------------------------------------------------------
-- 3.14 promotions : mã giảm giá / khuyến mãi
-- ---------------------------------------------------------------------
CREATE TABLE promotions (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                  VARCHAR(50)     NOT NULL COMMENT 'Mã nhập khi thanh toán, vd DDTECH10',
  name                  VARCHAR(150)    NOT NULL,
  description           VARCHAR(500)    NULL,
  discount_type         ENUM('PERCENT','FIXED') NOT NULL,
  discount_value        DECIMAL(15,2)   NOT NULL COMMENT 'PERCENT: 0-100, FIXED: số tiền',
  max_discount          DECIMAL(15,2)   NULL COMMENT 'Giảm tối đa (áp dụng cho PERCENT)',
  min_order_value       DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Giá trị tiền hàng tối thiểu',
  usage_limit           INT UNSIGNED    NULL COMMENT 'Tổng số lượt dùng, NULL = không giới hạn',
  usage_limit_per_user  INT UNSIGNED    NOT NULL DEFAULT 1,
  used_count            INT UNSIGNED    NOT NULL DEFAULT 0,
  start_date            DATETIME        NOT NULL,
  end_date              DATETIME        NOT NULL,
  status                ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotions_code (code),
  KEY idx_promotions_dates (start_date, end_date),
  CONSTRAINT chk_promotions_value     CHECK (discount_value > 0),
  CONSTRAINT chk_promotions_percent   CHECK (discount_type <> 'PERCENT' OR discount_value <= 100),
  CONSTRAINT chk_promotions_min_order CHECK (min_order_value >= 0),
  CONSTRAINT chk_promotions_dates     CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mã giảm giá';

-- ---------------------------------------------------------------------
-- 3.15 orders : đơn hàng
--      - receiver_*, shipping_address: SNAPSHOT địa chỉ lúc đặt
--        (user sửa sổ địa chỉ sau đó không ảnh hưởng đơn cũ)
--      - order_code: để trống -> trigger tự sinh DD00001, DD00002...
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_code          VARCHAR(20)     NOT NULL DEFAULT '' COMMENT 'DD00001 - trigger tự sinh nếu để trống',
  user_id             BIGINT UNSIGNED NOT NULL,
  receiver_name       VARCHAR(100)    NOT NULL,
  receiver_phone      VARCHAR(20)     NOT NULL,
  shipping_address    VARCHAR(500)    NOT NULL COMMENT 'Địa chỉ đầy đủ (snapshot)',
  shipping_method_id  BIGINT UNSIGNED NULL,
  promotion_id        BIGINT UNSIGNED NULL,
  promotion_code      VARCHAR(50)     NULL COMMENT 'Snapshot mã giảm giá đã dùng',
  subtotal            DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền hàng',
  shipping_fee        DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  total_amount        DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT '= subtotal + shipping_fee - discount_amount',
  payment_method      ENUM('COD','VNPAY','MOMO','ZALOPAY') NOT NULL DEFAULT 'COD',
  payment_status      ENUM('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  status              ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  note                VARCHAR(500)    NULL COMMENT 'Ghi chú của khách',
  cancel_reason       VARCHAR(255)    NULL,
  confirmed_at        DATETIME        NULL,
  delivered_at        DATETIME        NULL,
  cancelled_at        DATETIME        NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (order_code),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (status),
  KEY idx_orders_created (created_at),
  KEY idx_orders_payment_status (payment_status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_shipping_method FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND shipping_fee >= 0 AND discount_amount >= 0 AND total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đơn hàng';

-- ---------------------------------------------------------------------
-- 3.16 order_items : chi tiết đơn hàng - SNAPSHOT sản phẩm tại thời điểm mua
--      product_id ON DELETE SET NULL: xoá sản phẩm KHÔNG làm mất lịch sử.
--      subtotal là cột sinh tự động = price * quantity.
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NULL COMMENT 'Tham chiếu mềm, NULL nếu sản phẩm bị xoá cứng',
  variant_id      BIGINT UNSIGNED NULL,
  product_name    VARCHAR(255)    NOT NULL COMMENT 'Snapshot',
  product_sku     VARCHAR(50)     NOT NULL COMMENT 'Snapshot',
  product_image   VARCHAR(500)    NULL     COMMENT 'Snapshot ảnh chính',
  variant_name    VARCHAR(150)    NULL     COMMENT 'Snapshot, vd 256GB - Xanh Navy',
  original_price  DECIMAL(15,2)   NOT NULL COMMENT 'Giá gốc lúc mua',
  price           DECIMAL(15,2)   NOT NULL COMMENT 'Giá thực bán lúc mua (đã KM)',
  quantity        INT UNSIGNED    NOT NULL,
  subtotal        DECIMAL(15,2)   GENERATED ALWAYS AS (price * quantity) STORED,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price    CHECK (price >= 0 AND original_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết đơn hàng (snapshot)';

-- ---------------------------------------------------------------------
-- 3.17 order_status_history : lịch sử đổi trạng thái đơn
-- ---------------------------------------------------------------------
CREATE TABLE order_status_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     BIGINT UNSIGNED NOT NULL,
  from_status  ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED') NULL COMMENT 'NULL = tạo mới',
  to_status    ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED') NOT NULL,
  changed_by   BIGINT UNSIGNED NULL COMMENT 'users.id (admin hoặc khách), NULL = hệ thống',
  note         VARCHAR(255)    NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_status_history_order (order_id),
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử trạng thái đơn hàng';

-- ---------------------------------------------------------------------
-- 3.18 payments : thanh toán (COD / VNPAY / MOMO / ZALOPAY)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id          BIGINT UNSIGNED NOT NULL,
  method            ENUM('COD','VNPAY','MOMO','ZALOPAY') NOT NULL,
  status            ENUM('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  amount            DECIMAL(15,2)   NOT NULL,
  transaction_code  VARCHAR(100)    NULL COMMENT 'Mã giao dịch từ cổng thanh toán',
  gateway_response  JSON            NULL COMMENT 'Dữ liệu raw cổng thanh toán trả về',
  paid_at           DATETIME        NULL,
  refunded_at       DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_transaction (transaction_code),
  KEY idx_payments_order (order_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Giao dịch thanh toán';

-- ---------------------------------------------------------------------
-- 3.19 promotion_usages : lịch sử dùng mã giảm giá (giới hạn lượt / user)
-- ---------------------------------------------------------------------
CREATE TABLE promotion_usages (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  promotion_id     BIGINT UNSIGNED NOT NULL,
  user_id          BIGINT UNSIGNED NOT NULL,
  order_id         BIGINT UNSIGNED NOT NULL,
  discount_amount  DECIMAL(15,2)   NOT NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotion_usages_order (promotion_id, order_id),
  KEY idx_promotion_usages_user (promotion_id, user_id),
  CONSTRAINT fk_promotion_usages_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_promotion_usages_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_promotion_usages_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lượt sử dụng mã giảm giá';

-- ---------------------------------------------------------------------
-- 3.20 reviews : đánh giá sản phẩm (1 user chỉ review 1 sản phẩm 1 lần)
--      order_id + is_verified_purchase: hỗ trợ "chỉ người đã mua mới review"
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id               BIGINT UNSIGNED NOT NULL,
  product_id            BIGINT UNSIGNED NOT NULL,
  order_id              BIGINT UNSIGNED NULL COMMENT 'Đơn hàng đã mua sản phẩm này',
  rating                TINYINT UNSIGNED NOT NULL,
  comment               TEXT            NULL,
  images                JSON            NULL COMMENT 'Mảng URL ảnh đính kèm',
  is_verified_purchase  TINYINT(1)      NOT NULL DEFAULT 0,
  admin_reply           TEXT            NULL,
  replied_at            DATETIME        NULL,
  status                ENUM('PENDING','APPROVED','HIDDEN') NOT NULL DEFAULT 'APPROVED',
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_product (user_id, product_id),
  KEY idx_reviews_product_status (product_id, status),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đánh giá sản phẩm';

-- ---------------------------------------------------------------------
-- 3.21 notifications : thông báo (kết hợp Socket.io)
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL COMMENT 'Người nhận (khách hoặc admin)',
  title           VARCHAR(255)    NOT NULL,
  message         TEXT            NOT NULL,
  type            ENUM('ORDER','PAYMENT','PROMOTION','REVIEW','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  reference_type  VARCHAR(50)     NULL COMMENT 'vd: order, product, promotion',
  reference_id    BIGINT UNSIGNED NULL COMMENT 'id của bản ghi liên quan',
  is_read         TINYINT(1)      NOT NULL DEFAULT 0,
  read_at         DATETIME        NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read (user_id, is_read),
  KEY idx_notifications_created (created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông báo người dùng';

-- ---------------------------------------------------------------------
-- 3.22 inventory_transactions : lịch sử xuất/nhập kho
--      quantity: dương = nhập/hoàn (IMPORT, RETURN, CANCEL_ORDER),
--                âm    = xuất (SALE), ADJUSTMENT có thể âm hoặc dương
--      product_id RESTRICT: không xoá cứng sản phẩm đã có lịch sử kho.
-- ---------------------------------------------------------------------
CREATE TABLE inventory_transactions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      BIGINT UNSIGNED NOT NULL,
  variant_id      BIGINT UNSIGNED NULL,
  type            ENUM('IMPORT','SALE','RETURN','ADJUSTMENT','CANCEL_ORDER') NOT NULL,
  quantity        INT             NOT NULL COMMENT 'Dương = tăng kho, âm = giảm kho',
  stock_after     INT UNSIGNED    NOT NULL COMMENT 'Tồn kho (của product hoặc variant) sau giao dịch',
  reference_type  VARCHAR(50)     NULL COMMENT 'vd: order',
  reference_id    BIGINT UNSIGNED NULL COMMENT 'vd: orders.id',
  note            VARCHAR(255)    NULL,
  created_by      BIGINT UNSIGNED NULL COMMENT 'users.id thực hiện, NULL = hệ thống',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_product (product_id, created_at),
  KEY idx_inventory_variant (variant_id),
  KEY idx_inventory_type (type),
  KEY idx_inventory_reference (reference_type, reference_id),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_user FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_inventory_quantity CHECK (quantity <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử biến động tồn kho';

-- ---------------------------------------------------------------------
-- 3.23 banners : banner quảng cáo trang chủ mobile
-- ---------------------------------------------------------------------
CREATE TABLE banners (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(150)    NOT NULL,
  image_url   VARCHAR(500)    NOT NULL,
  link_type   ENUM('NONE','PRODUCT','CATEGORY','URL') NOT NULL DEFAULT 'NONE',
  link_value  VARCHAR(500)    NULL COMMENT 'product_id / category_id / URL tuỳ link_type',
  position    VARCHAR(50)     NOT NULL DEFAULT 'HOME_SLIDER',
  sort_order  INT             NOT NULL DEFAULT 0,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  start_date  DATETIME        NULL,
  end_date    DATETIME        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_banners_position_status (position, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Banner trang chủ';

-- =====================================================================
-- 4. TRIGGER: tự sinh order_code dạng DD00001 nếu backend không truyền
--    (backend vẫn có thể tự sinh và truyền vào; trigger chỉ chạy khi rỗng)
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_orders_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    SET NEW.order_code = CONCAT('DD', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM orders), 5, '0'));
  END IF;
END$$

DELIMITER ;

-- =====================================================================
-- 5. DỮ LIỆU MẪU
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5.1 users
--   admin@ddtech.vn   / Admin@123   (bcrypt thật, cost 10)
--   an.nguyen@gmail.com, binh.tran@gmail.com, cuong.le@gmail.com / User@123
-- ---------------------------------------------------------------------
INSERT INTO users (id, full_name, email, phone, password_hash, avatar_url, gender, date_of_birth, role, status, last_login_at, created_at) VALUES
(1, 'DDTECH Admin',    'admin@ddtech.vn',     '0900000001', '$2b$10$xsy48/hms87uA8zdcVr0geq12Fng43sczn64fT6dxbPXHPAMQkfx2', 'https://placehold.co/200x200/0f172a/ffffff/png?text=AD', 'MALE',   '1995-01-15', 'ADMIN',    'ACTIVE', '2026-09-10 08:00:00', '2026-08-01 08:00:00'),
(2, 'Nguyễn Văn An',   'an.nguyen@gmail.com', '0901234567', '$2b$10$rJ1ol4mzx.8rJwHF5RwEpOEnKHV7HuFzxnY9m3p1r.tgeg1kBHSPK', 'https://placehold.co/200x200/2563eb/ffffff/png?text=AN', 'MALE',   '2003-05-20', 'CUSTOMER', 'ACTIVE', '2026-09-10 08:25:00', '2026-08-10 09:30:00'),
(3, 'Trần Thị Bình',   'binh.tran@gmail.com', '0912345678', '$2b$10$rJ1ol4mzx.8rJwHF5RwEpOEnKHV7HuFzxnY9m3p1r.tgeg1kBHSPK', 'https://placehold.co/200x200/db2777/ffffff/png?text=TB', 'FEMALE', '2002-11-02', 'CUSTOMER', 'ACTIVE', '2026-09-08 10:00:00', '2026-08-15 14:00:00'),
(4, 'Lê Văn Cường',    'cuong.le@gmail.com',  '0923456789', '$2b$10$rJ1ol4mzx.8rJwHF5RwEpOEnKHV7HuFzxnY9m3p1r.tgeg1kBHSPK', NULL,                                                       'MALE',   '2001-03-08', 'CUSTOMER', 'LOCKED', '2026-08-20 20:00:00', '2026-08-18 19:45:00');

-- ---------------------------------------------------------------------
-- 5.2 addresses
-- ---------------------------------------------------------------------
INSERT INTO addresses (id, user_id, receiver_name, receiver_phone, province, district, ward, address_line, address_type, is_default) VALUES
(1, 2, 'Nguyễn Văn An',  '0901234567', 'TP. Hồ Chí Minh', 'Quận 1',        'Phường Bến Nghé', '12 Nguyễn Huệ',        'HOME',   1),
(2, 2, 'Nguyễn Văn An',  '0901234567', 'TP. Hồ Chí Minh', 'Quận Tân Bình', 'Phường 4',        '230 Hoàng Văn Thụ',    'OFFICE', 0),
(3, 3, 'Trần Thị Bình',  '0912345678', 'Hà Nội',          'Quận Đống Đa',  'Phường Láng Hạ',  '45 Láng Hạ',           'HOME',   1),
(4, 4, 'Lê Văn Cường',   '0923456789', 'Đà Nẵng',         'Quận Hải Châu', 'Phường Thạch Thang', '88 Lê Duẩn',        'HOME',   1);

-- ---------------------------------------------------------------------
-- 5.3 categories
-- ---------------------------------------------------------------------
INSERT INTO categories (id, parent_id, name, slug, description, image_url, sort_order, status) VALUES
(1,  NULL, 'Điện thoại', 'dien-thoai', 'Smartphone các hãng',            'https://placehold.co/200x200/1e293b/ffffff/png?text=Phone',    1,  'ACTIVE'),
(2,  NULL, 'Laptop',     'laptop',     'Laptop văn phòng, gaming',        'https://placehold.co/200x200/1e293b/ffffff/png?text=Laptop',   2,  'ACTIVE'),
(3,  NULL, 'PC',         'pc',         'Máy tính để bàn nguyên bộ',       'https://placehold.co/200x200/1e293b/ffffff/png?text=PC',       3,  'ACTIVE'),
(4,  NULL, 'CPU',        'cpu',        'Bộ vi xử lý Intel, AMD',          'https://placehold.co/200x200/1e293b/ffffff/png?text=CPU',      4,  'ACTIVE'),
(5,  NULL, 'GPU',        'gpu',        'Card đồ họa',                      'https://placehold.co/200x200/1e293b/ffffff/png?text=GPU',      5,  'ACTIVE'),
(6,  NULL, 'Mainboard',  'mainboard',  'Bo mạch chủ',                      'https://placehold.co/200x200/1e293b/ffffff/png?text=Main',     6,  'ACTIVE'),
(7,  NULL, 'RAM',        'ram',        'Bộ nhớ trong',                     'https://placehold.co/200x200/1e293b/ffffff/png?text=RAM',      7,  'ACTIVE'),
(8,  NULL, 'SSD',        'ssd',        'Ổ cứng thể rắn',                   'https://placehold.co/200x200/1e293b/ffffff/png?text=SSD',      8,  'ACTIVE'),
(9,  NULL, 'Màn hình',   'man-hinh',   'Màn hình máy tính',                'https://placehold.co/200x200/1e293b/ffffff/png?text=Monitor',  9,  'ACTIVE'),
(10, NULL, 'Bàn phím',   'ban-phim',   'Bàn phím cơ, bàn phím văn phòng', 'https://placehold.co/200x200/1e293b/ffffff/png?text=Keyboard', 10, 'ACTIVE'),
(11, NULL, 'Chuột',      'chuot',      'Chuột gaming, văn phòng',          'https://placehold.co/200x200/1e293b/ffffff/png?text=Mouse',    11, 'ACTIVE'),
(12, NULL, 'Tai nghe',   'tai-nghe',   'Tai nghe gaming, không dây',       'https://placehold.co/200x200/1e293b/ffffff/png?text=Headset',  12, 'ACTIVE'),
(13, NULL, 'Phụ kiện',   'phu-kien',   'Cáp, sạc, đế tản nhiệt...',        'https://placehold.co/200x200/1e293b/ffffff/png?text=Acc',      13, 'ACTIVE');

-- ---------------------------------------------------------------------
-- 5.4 brands
-- ---------------------------------------------------------------------
INSERT INTO brands (id, name, slug, logo_url, status) VALUES
(1,  'ASUS',     'asus',     'https://placehold.co/200x80/ffffff/000000/png?text=ASUS',     'ACTIVE'),
(2,  'MSI',      'msi',      'https://placehold.co/200x80/ffffff/000000/png?text=MSI',      'ACTIVE'),
(3,  'Gigabyte', 'gigabyte', 'https://placehold.co/200x80/ffffff/000000/png?text=Gigabyte', 'ACTIVE'),
(4,  'Intel',    'intel',    'https://placehold.co/200x80/ffffff/000000/png?text=Intel',    'ACTIVE'),
(5,  'AMD',      'amd',      'https://placehold.co/200x80/ffffff/000000/png?text=AMD',      'ACTIVE'),
(6,  'NVIDIA',   'nvidia',   'https://placehold.co/200x80/ffffff/000000/png?text=NVIDIA',   'ACTIVE'),
(7,  'Logitech', 'logitech', 'https://placehold.co/200x80/ffffff/000000/png?text=Logitech', 'ACTIVE'),
(8,  'Razer',    'razer',    'https://placehold.co/200x80/ffffff/000000/png?text=Razer',    'ACTIVE'),
(9,  'Samsung',  'samsung',  'https://placehold.co/200x80/ffffff/000000/png?text=Samsung',  'ACTIVE'),
(10, 'Apple',    'apple',    'https://placehold.co/200x80/ffffff/000000/png?text=Apple',    'ACTIVE'),
(11, 'Kingston', 'kingston', 'https://placehold.co/200x80/ffffff/000000/png?text=Kingston', 'ACTIVE'),
(12, 'Corsair',  'corsair',  'https://placehold.co/200x80/ffffff/000000/png?text=Corsair',  'ACTIVE');

-- ---------------------------------------------------------------------
-- 5.5 category_attributes (mẫu thông số theo danh mục)
-- ---------------------------------------------------------------------
INSERT INTO category_attributes (category_id, attr_key, attr_name, unit, input_type, options, is_filterable, sort_order) VALUES
-- Điện thoại (1)
(1, 'screen',   'Màn hình',       NULL,  'TEXT',   NULL, 0, 1),
(1, 'chip',     'Chip xử lý',     NULL,  'TEXT',   NULL, 0, 2),
(1, 'ram',      'RAM',            'GB',  'SELECT', JSON_ARRAY('4GB','6GB','8GB','12GB','16GB'), 1, 3),
(1, 'storage',  'Bộ nhớ trong',   'GB',  'SELECT', JSON_ARRAY('64GB','128GB','256GB','512GB','1TB'), 1, 4),
(1, 'battery',  'Pin',            'mAh', 'TEXT',   NULL, 0, 5),
(1, 'camera',   'Camera sau',     NULL,  'TEXT',   NULL, 0, 6),
(1, 'os',       'Hệ điều hành',   NULL,  'SELECT', JSON_ARRAY('Android','iOS'), 1, 7),
-- Laptop (2)
(2, 'cpu',      'CPU',            NULL,  'TEXT',   NULL, 1, 1),
(2, 'gpu',      'Card đồ họa',    NULL,  'TEXT',   NULL, 0, 2),
(2, 'ram',      'RAM',            'GB',  'SELECT', JSON_ARRAY('8GB','16GB','32GB','64GB'), 1, 3),
(2, 'storage',  'Ổ cứng',         NULL,  'TEXT',   NULL, 0, 4),
(2, 'screen',   'Màn hình',       NULL,  'TEXT',   NULL, 0, 5),
(2, 'weight',   'Trọng lượng',    'kg',  'TEXT',   NULL, 0, 6),
(2, 'os',       'Hệ điều hành',   NULL,  'TEXT',   NULL, 0, 7),
-- CPU (4)
(4, 'socket',      'Socket',         NULL,  'SELECT', JSON_ARRAY('AM4','AM5','LGA1700','LGA1851'), 1, 1),
(4, 'cores',       'Số nhân',        NULL,  'NUMBER', NULL, 1, 2),
(4, 'threads',     'Số luồng',       NULL,  'NUMBER', NULL, 0, 3),
(4, 'base_clock',  'Xung cơ bản',    'GHz', 'TEXT',   NULL, 0, 4),
(4, 'boost_clock', 'Xung tối đa',    'GHz', 'TEXT',   NULL, 0, 5),
(4, 'tdp',         'TDP',            'W',   'TEXT',   NULL, 0, 6),
-- GPU (5)
(5, 'gpu_chip',        'Chip đồ họa',      NULL,  'TEXT',   NULL, 1, 1),
(5, 'vram',            'VRAM',             'GB',  'SELECT', JSON_ARRAY('6GB','8GB','12GB','16GB','24GB'), 1, 2),
(5, 'memory_type',     'Loại bộ nhớ',      NULL,  'TEXT',   NULL, 0, 3),
(5, 'boost_clock',     'Xung boost',       'MHz', 'TEXT',   NULL, 0, 4),
(5, 'recommended_psu', 'Nguồn đề nghị',    'W',   'TEXT',   NULL, 0, 5),
-- Mainboard (6)
(6, 'socket',      'Socket',           NULL, 'SELECT', JSON_ARRAY('AM4','AM5','LGA1700','LGA1851'), 1, 1),
(6, 'chipset',     'Chipset',          NULL, 'TEXT',   NULL, 1, 2),
(6, 'form_factor', 'Kích thước',       NULL, 'SELECT', JSON_ARRAY('ATX','Micro-ATX','Mini-ITX'), 1, 3),
(6, 'ram_type',    'Loại RAM hỗ trợ',  NULL, 'SELECT', JSON_ARRAY('DDR4','DDR5'), 1, 4),
(6, 'max_ram',     'RAM tối đa',       'GB', 'TEXT',   NULL, 0, 5),
(6, 'wifi',        'WiFi',             NULL, 'TEXT',   NULL, 0, 6),
-- RAM (7)
(7, 'ram_type',  'Loại RAM',      NULL,  'SELECT', JSON_ARRAY('DDR4','DDR5'), 1, 1),
(7, 'capacity',  'Dung lượng',    'GB',  'SELECT', JSON_ARRAY('8GB','16GB','32GB','64GB'), 1, 2),
(7, 'speed',     'Bus',           'MHz', 'TEXT',   NULL, 1, 3),
(7, 'latency',   'Độ trễ (CL)',   NULL,  'TEXT',   NULL, 0, 4),
-- SSD (8)
(8, 'form_factor', 'Chuẩn kích thước', NULL, 'SELECT', JSON_ARRAY('2.5 inch','M.2 2280'), 1, 1),
(8, 'interface',   'Giao tiếp',        NULL, 'SELECT', JSON_ARRAY('SATA III','PCIe 3.0 x4','PCIe 4.0 x4','PCIe 5.0 x4'), 1, 2),
(8, 'capacity',    'Dung lượng',       NULL, 'SELECT', JSON_ARRAY('256GB','512GB','1TB','2TB'), 1, 3),
(8, 'read_speed',  'Tốc độ đọc',       'MB/s', 'TEXT', NULL, 0, 4),
(8, 'write_speed', 'Tốc độ ghi',       'MB/s', 'TEXT', NULL, 0, 5),
-- Màn hình (9)
(9, 'screen_size',   'Kích thước',      'inch', 'TEXT',   NULL, 1, 1),
(9, 'resolution',    'Độ phân giải',    NULL,   'SELECT', JSON_ARRAY('Full HD','2K','4K'), 1, 2),
(9, 'panel',         'Tấm nền',         NULL,   'SELECT', JSON_ARRAY('IPS','VA','TN','OLED'), 1, 3),
(9, 'refresh_rate',  'Tần số quét',     'Hz',   'TEXT',   NULL, 1, 4),
(9, 'response_time', 'Thời gian phản hồi', 'ms', 'TEXT', NULL, 0, 5),
-- Chuột (11)
(11, 'sensor',     'Cảm biến',     NULL, 'TEXT',   NULL, 0, 1),
(11, 'dpi',        'DPI tối đa',   NULL, 'TEXT',   NULL, 0, 2),
(11, 'connection', 'Kết nối',      NULL, 'SELECT', JSON_ARRAY('Có dây','Không dây 2.4GHz','Bluetooth'), 1, 3),
(11, 'weight',     'Trọng lượng',  'g',  'TEXT',   NULL, 0, 4),
(11, 'battery',    'Pin',          NULL, 'TEXT',   NULL, 0, 5);

-- ---------------------------------------------------------------------
-- 5.6 products
-- ---------------------------------------------------------------------
INSERT INTO products (id, category_id, brand_id, name, slug, sku, short_description, description, specifications, price, sale_price, stock, sold_count, has_variants, warranty_months, weight_gram, rating_avg, review_count, view_count, is_featured, is_new, status, created_at) VALUES
(1, 6, 1,
 'ASUS TUF Gaming B550M-PLUS WIFI II', 'asus-tuf-gaming-b550m-plus-wifi-ii', 'MB-ASUS-B550M-TUF',
 'Mainboard AM4 Micro-ATX, chipset B550, WiFi 6, hỗ trợ Ryzen 5000.',
 'Bo mạch chủ ASUS TUF Gaming B550M-PLUS WIFI II sở hữu độ bền chuẩn quân sự TUF, hỗ trợ CPU AMD Ryzen socket AM4, PCIe 4.0, 2 khe M.2 và WiFi 6 tích hợp.',
 JSON_OBJECT('socket','AM4','chipset','B550','form_factor','Micro-ATX','ram_type','DDR4','max_ram','128GB','wifi','WiFi 6'),
 3290000.00, 2990000.00, 25, 1, 0, 36, 900, 5.0, 1, 320, 1, 0, 'ACTIVE', '2026-08-01 09:00:00'),

(2, 4, 5,
 'AMD Ryzen 5 5600', 'amd-ryzen-5-5600', 'CPU-AMD-R5-5600',
 'CPU 6 nhân 12 luồng, socket AM4, boost 4.4GHz, kèm tản Wraith Stealth.',
 'AMD Ryzen 5 5600 là lựa chọn hiệu năng/giá tốt nhất cho cấu hình gaming tầm trung trên nền tảng AM4.',
 JSON_OBJECT('socket','AM4','cores',6,'threads',12,'base_clock','3.5GHz','boost_clock','4.4GHz','tdp','65W'),
 3190000.00, 2890000.00, 40, 1, 0, 36, 300, 4.0, 1, 410, 1, 0, 'ACTIVE', '2026-08-01 09:05:00'),

(3, 4, 4,
 'Intel Core i5-12400F', 'intel-core-i5-12400f', 'CPU-INTEL-I5-12400F',
 'CPU 6 nhân 12 luồng thế hệ 12, socket LGA1700, không tích hợp iGPU.',
 'Intel Core i5-12400F mang hiệu năng đơn nhân mạnh mẽ, phù hợp cho gaming khi kết hợp card đồ họa rời.',
 JSON_OBJECT('socket','LGA1700','cores',6,'threads',12,'base_clock','2.5GHz','boost_clock','4.4GHz','tdp','65W'),
 3590000.00, 3290000.00, 30, 0, 0, 36, 300, 0.0, 0, 275, 0, 0, 'ACTIVE', '2026-08-01 09:10:00'),

(4, 11, 7,
 'Logitech G304 Lightspeed Wireless', 'logitech-g304-lightspeed-wireless', 'MS-LOGI-G304',
 'Chuột gaming không dây 2.4GHz, cảm biến HERO 12K, pin AA 250 giờ.',
 'Logitech G304 Lightspeed là chuột gaming không dây phổ biến nhất tầm giá, nhẹ 99g, độ trễ 1ms.',
 JSON_OBJECT('sensor','HERO','dpi','12000','connection','Không dây 2.4GHz','weight','99g','battery','1 pin AA - 250 giờ'),
 890000.00, 699000.00, 100, 3, 0, 24, 99, 5.0, 1, 980, 1, 0, 'ACTIVE', '2026-08-01 09:15:00'),

(5, 11, 8,
 'Razer DeathAdder V3', 'razer-deathadder-v3', 'MS-RAZER-DAV3',
 'Chuột gaming có dây siêu nhẹ 59g, cảm biến Focus Pro 30K.',
 'Razer DeathAdder V3 giữ form cầm huyền thoại với trọng lượng chỉ 59g, switch quang học thế hệ 3.',
 JSON_OBJECT('sensor','Focus Pro 30K','dpi','30000','connection','Có dây','weight','59g','battery','Không'),
 1690000.00, NULL, 35, 0, 0, 24, 59, 0.0, 0, 210, 0, 0, 'ACTIVE', '2026-08-01 09:20:00'),

(6, 8, 9,
 'Samsung SSD 980 1TB NVMe PCIe 3.0', 'samsung-ssd-980-1tb-nvme', 'SSD-SS-980-1TB',
 'SSD M.2 NVMe 1TB, đọc 3500MB/s, ghi 3000MB/s.',
 'Samsung 980 là SSD NVMe không DRAM với hiệu năng ổn định, bảo hành 5 năm, phù hợp nâng cấp laptop và PC.',
 JSON_OBJECT('form_factor','M.2 2280','interface','PCIe 3.0 x4','capacity','1TB','read_speed','3500','write_speed','3000'),
 1890000.00, 1590000.00, 60, 1, 0, 60, 9, 4.0, 1, 640, 1, 0, 'ACTIVE', '2026-08-01 09:25:00'),

(7, 9, 1,
 'ASUS TUF Gaming VG249Q1A 24" 165Hz', 'asus-tuf-gaming-vg249q1a-24-165hz', 'MON-ASUS-VG249Q1A',
 'Màn hình gaming 23.8" IPS Full HD, 165Hz, 1ms MPRT, FreeSync Premium.',
 'ASUS TUF Gaming VG249Q1A mang trải nghiệm chơi game mượt mà với tần số quét 165Hz và công nghệ ELMB.',
 JSON_OBJECT('screen_size','23.8','resolution','Full HD','panel','IPS','refresh_rate','165','response_time','1'),
 3990000.00, 3490000.00, 5, 0, 0, 36, 3800, 0.0, 0, 188, 0, 0, 'ACTIVE', '2026-08-01 09:30:00'),

(8, 5, 2,
 'MSI GeForce RTX 5060 8G VENTUS 2X OC', 'msi-geforce-rtx-5060-8g-ventus-2x-oc', 'GPU-MSI-RTX5060-V2X',
 'Card đồ họa RTX 5060 8GB GDDR7, DLSS 4, tản nhiệt 2 quạt.',
 'MSI RTX 5060 VENTUS 2X OC là card đồ họa thế hệ Blackwell tầm trung với hiệu năng chơi game Full HD/2K tối đa.',
 JSON_OBJECT('gpu_chip','GeForce RTX 5060','vram','8GB','memory_type','GDDR7','boost_clock','2535','recommended_psu','550'),
 10990000.00, 9990000.00, 12, 1, 0, 36, 850, 0.0, 0, 1520, 1, 1, 'ACTIVE', '2026-08-05 10:00:00'),

(9, 1, 9,
 'Samsung Galaxy S25', 'samsung-galaxy-s25', 'PH-SS-S25',
 'Flagship Samsung 6.2" Dynamic AMOLED 2X 120Hz, Snapdragon 8 Elite, Galaxy AI.',
 'Samsung Galaxy S25 với chip Snapdragon 8 Elite for Galaxy, camera 50MP, pin 4000mAh, hỗ trợ 7 năm cập nhật.',
 JSON_OBJECT('screen','6.2 inch Dynamic AMOLED 2X 120Hz','chip','Snapdragon 8 Elite','ram','12GB','storage','256GB / 512GB','battery','4000mAh','camera','50MP + 12MP + 10MP','os','Android'),
 22990000.00, 19990000.00, 14, 1, 1, 12, 162, 0.0, 0, 2100, 1, 1, 'ACTIVE', '2026-08-05 10:10:00'),

(10, 1, 10,
 'Apple iPhone 16', 'apple-iphone-16', 'PH-AP-IP16',
 'iPhone 16 6.1" Super Retina XDR, chip A18, Camera Control, Apple Intelligence.',
 'iPhone 16 trang bị chip A18, camera Fusion 48MP, nút Camera Control mới và thời lượng pin cải thiện.',
 JSON_OBJECT('screen','6.1 inch Super Retina XDR','chip','Apple A18','ram','8GB','storage','128GB / 256GB','battery','3561mAh','camera','48MP + 12MP','os','iOS'),
 22990000.00, NULL, 14, 0, 1, 12, 170, 0.0, 0, 1890, 1, 1, 'ACTIVE', '2026-08-05 10:20:00'),

(11, 7, 11,
 'Kingston FURY Beast 16GB DDR4 3200MHz', 'kingston-fury-beast-16gb-ddr4-3200mhz', 'RAM-KS-FB16-3200',
 'RAM DDR4 16GB (1x16GB) bus 3200, CL16, tản nhiệt nhôm.',
 'Kingston FURY Beast DDR4 hỗ trợ XMP 2.0, ép xung dễ dàng, tương thích rộng với mainboard Intel và AMD.',
 JSON_OBJECT('ram_type','DDR4','capacity','16GB','speed','3200','latency','CL16'),
 1190000.00, 990000.00, 80, 2, 0, 36, 60, 0.0, 0, 530, 0, 0, 'ACTIVE', '2026-08-01 09:35:00'),

(12, 2, 1,
 'ASUS ROG Strix G16 G614JV (i7-13650HX, RTX 4060)', 'asus-rog-strix-g16-g614jv', 'LT-ASUS-ROG-G614JV',
 'Laptop gaming 16" 165Hz, Core i7-13650HX, RTX 4060 8GB, 16GB DDR5, 512GB SSD.',
 'ASUS ROG Strix G16 G614JV là laptop gaming cao cấp với tản nhiệt Intelligent Cooling và màn hình 16 inch tỷ lệ 16:10.',
 JSON_OBJECT('cpu','Intel Core i7-13650HX','gpu','NVIDIA GeForce RTX 4060 8GB','ram','16GB','storage','512GB SSD NVMe','screen','16 inch FHD+ 165Hz','weight','2.5','os','Windows 11 Home'),
 42990000.00, 39990000.00, 3, 0, 0, 24, 2500, 0.0, 0, 760, 0, 1, 'ACTIVE', '2026-08-08 11:00:00');

-- ---------------------------------------------------------------------
-- 5.7 product_variants (cho điện thoại)
-- ---------------------------------------------------------------------
INSERT INTO product_variants (id, product_id, sku, variant_name, attributes, price, sale_price, stock, sold_count, sort_order, status) VALUES
(1, 9,  'PH-SS-S25-256',  '256GB - Xanh Navy', JSON_OBJECT('storage','256GB','color','Xanh Navy'), 22990000.00, 19990000.00, 9, 1, 1, 'ACTIVE'),
(2, 9,  'PH-SS-S25-512',  '512GB - Xanh Navy', JSON_OBJECT('storage','512GB','color','Xanh Navy'), 25990000.00, 22990000.00, 5, 0, 2, 'ACTIVE'),
(3, 10, 'PH-AP-IP16-128', '128GB - Đen',       JSON_OBJECT('storage','128GB','color','Đen'),       22990000.00, NULL,        8, 0, 1, 'ACTIVE'),
(4, 10, 'PH-AP-IP16-256', '256GB - Đen',       JSON_OBJECT('storage','256GB','color','Đen'),       25990000.00, NULL,        6, 0, 2, 'ACTIVE');

-- ---------------------------------------------------------------------
-- 5.8 product_images (mỗi sản phẩm 2 ảnh, ảnh đầu là ảnh chính)
-- ---------------------------------------------------------------------
INSERT INTO product_images (product_id, variant_id, image_url, alt_text, is_primary, sort_order) VALUES
(1,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=B550M-PLUS+1',    'ASUS TUF B550M-PLUS mặt trước', 1, 1),
(1,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=B550M-PLUS+2',    'ASUS TUF B550M-PLUS cổng I/O',  0, 2),
(2,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=Ryzen+5+5600+1',  'AMD Ryzen 5 5600 hộp',          1, 1),
(2,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=Ryzen+5+5600+2',  'AMD Ryzen 5 5600 CPU',          0, 2),
(3,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=i5-12400F+1',     'Intel Core i5-12400F hộp',      1, 1),
(3,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=i5-12400F+2',     'Intel Core i5-12400F CPU',      0, 2),
(4,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=G304+1',          'Logitech G304 màu đen',         1, 1),
(4,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=G304+2',          'Logitech G304 mặt dưới',        0, 2),
(5,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=DeathAdder+V3+1', 'Razer DeathAdder V3',           1, 1),
(5,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=DeathAdder+V3+2', 'Razer DeathAdder V3 góc nghiêng', 0, 2),
(6,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=SSD+980+1',       'Samsung SSD 980 1TB',           1, 1),
(6,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=SSD+980+2',       'Samsung SSD 980 hộp',           0, 2),
(7,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=VG249Q1A+1',      'ASUS VG249Q1A mặt trước',       1, 1),
(7,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=VG249Q1A+2',      'ASUS VG249Q1A mặt sau',         0, 2),
(8,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=RTX+5060+1',      'MSI RTX 5060 VENTUS 2X',        1, 1),
(8,  NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=RTX+5060+2',      'MSI RTX 5060 cổng xuất hình',   0, 2),
(9,  NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=Galaxy+S25+1',    'Samsung Galaxy S25',            1, 1),
(9,  1,    'https://placehold.co/800x800/1e3a8a/ffffff/png?text=S25+Navy',        'Galaxy S25 Xanh Navy',          0, 2),
(10, NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=iPhone+16+1',     'Apple iPhone 16',               1, 1),
(10, 3,    'https://placehold.co/800x800/000000/ffffff/png?text=iPhone+16+Black', 'iPhone 16 Đen',                 0, 2),
(11, NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=FURY+Beast+1',    'Kingston FURY Beast 16GB',      1, 1),
(11, NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=FURY+Beast+2',    'Kingston FURY Beast tản nhiệt', 0, 2),
(12, NULL, 'https://placehold.co/800x800/1e293b/ffffff/png?text=ROG+Strix+G16+1', 'ASUS ROG Strix G16',            1, 1),
(12, NULL, 'https://placehold.co/800x800/334155/ffffff/png?text=ROG+Strix+G16+2', 'ASUS ROG Strix G16 bàn phím',   0, 2);

-- ---------------------------------------------------------------------
-- 5.9 shipping_methods
-- ---------------------------------------------------------------------
INSERT INTO shipping_methods (id, code, name, description, base_fee, free_threshold, estimated_days_min, estimated_days_max, sort_order, status) VALUES
(1, 'STANDARD', 'Giao hàng tiêu chuẩn', 'Miễn phí cho đơn từ 2.000.000đ', 30000.00, 2000000.00, 2, 4, 1, 'ACTIVE'),
(2, 'EXPRESS',  'Giao hàng nhanh',      'Nhận hàng trong 24h (nội thành)', 60000.00, NULL,       1, 1, 2, 'ACTIVE');

-- ---------------------------------------------------------------------
-- 5.10 promotions
-- ---------------------------------------------------------------------
INSERT INTO promotions (id, code, name, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, usage_limit_per_user, used_count, start_date, end_date, status) VALUES
(1, 'DDTECH10',   'Giảm 10% toàn bộ sản phẩm', 'Giảm 10%, tối đa 500.000đ cho đơn từ 2.000.000đ', 'PERCENT', 10.00,     500000.00, 2000000.00, 1000, 5, 2, '2026-08-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(2, 'FREESHIP30', 'Miễn phí vận chuyển',        'Giảm 30.000đ phí ship cho đơn từ 500.000đ',      'FIXED',   30000.00,  NULL,      500000.00,  NULL, 3, 0, '2026-08-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(3, 'WELCOME50K', 'Chào mừng thành viên mới',   'Giảm 50.000đ cho đơn đầu tiên từ 1.000.000đ',    'FIXED',   50000.00,  NULL,      1000000.00, NULL, 1, 1, '2026-08-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(4, 'SUMMER2026', 'Hè rực rỡ 2026',             'Giảm 15%, tối đa 1.000.000đ (đã hết hạn)',       'PERCENT', 15.00,     1000000.00, 3000000.00, 500, 1, 0, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 'ACTIVE');

-- ---------------------------------------------------------------------
-- 5.11 orders (truyền order_code trực tiếp; để trống thì trigger tự sinh)
-- ---------------------------------------------------------------------
INSERT INTO orders (id, order_code, user_id, receiver_name, receiver_phone, shipping_address, shipping_method_id, promotion_id, promotion_code, subtotal, shipping_fee, discount_amount, total_amount, payment_method, payment_status, status, note, cancel_reason, confirmed_at, delivered_at, cancelled_at, created_at, updated_at) VALUES
(1, 'DD00001', 2, 'Nguyễn Văn An', '0901234567', '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 1, 1, 'DDTECH10', 5880000.00,  0.00,     500000.00, 5380000.00,  'COD',   'PAID',   'DELIVERED', 'Giao giờ hành chính',        NULL,                           '2026-08-20 10:00:00', '2026-08-22 15:30:00', NULL,                  '2026-08-20 09:15:00', '2026-08-22 15:30:00'),
(2, 'DD00002', 3, 'Trần Thị Bình',  '0912345678', '45 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',        1, NULL, NULL,     2988000.00,  0.00,     0.00,      2988000.00,  'VNPAY', 'PAID',   'DELIVERED', NULL,                          NULL,                           '2026-08-28 15:00:00', '2026-08-31 11:00:00', NULL,                  '2026-08-28 14:20:00', '2026-08-31 11:00:00'),
(3, 'DD00003', 2, 'Nguyễn Văn An', '0901234567', '230 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh', 1, NULL, NULL,   1690000.00,  30000.00, 0.00,      1720000.00,  'COD',   'UNPAID', 'CANCELLED', NULL,                          'Khách đổi ý, không mua nữa',   NULL,                  NULL,                  '2026-09-03 18:00:00', '2026-09-03 16:45:00', '2026-09-03 18:00:00'),
(4, 'DD00004', 3, 'Trần Thị Bình',  '0912345678', '45 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',        1, 3, 'WELCOME50K', 2679000.00, 0.00,    50000.00,  2629000.00,  'COD',   'UNPAID', 'CONFIRMED', 'Gọi trước khi giao',          NULL,                           '2026-09-08 10:40:00', NULL,                  NULL,                  '2026-09-08 10:05:00', '2026-09-08 10:40:00'),
(5, 'DD00005', 2, 'Nguyễn Văn An', '0901234567', '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 2, 1, 'DDTECH10', 29980000.00, 60000.00, 500000.00, 29540000.00, 'VNPAY', 'PAID',   'PENDING',   NULL,                          NULL,                           NULL,                  NULL,                  NULL,                  '2026-09-10 08:30:00', '2026-09-10 08:32:00');

-- ---------------------------------------------------------------------
-- 5.12 order_items (snapshot giá tại thời điểm mua, subtotal tự tính)
-- ---------------------------------------------------------------------
INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_sku, product_image, variant_name, original_price, price, quantity, created_at) VALUES
-- DD00001
(1, 1, NULL, 'ASUS TUF Gaming B550M-PLUS WIFI II',  'MB-ASUS-B550M-TUF',   'https://placehold.co/800x800/1e293b/ffffff/png?text=B550M-PLUS+1',   NULL, 3290000.00,  2990000.00,  1, '2026-08-20 09:15:00'),
(1, 2, NULL, 'AMD Ryzen 5 5600',                    'CPU-AMD-R5-5600',     'https://placehold.co/800x800/1e293b/ffffff/png?text=Ryzen+5+5600+1', NULL, 3190000.00,  2890000.00,  1, '2026-08-20 09:15:00'),
-- DD00002
(2, 4, NULL, 'Logitech G304 Lightspeed Wireless',   'MS-LOGI-G304',        'https://placehold.co/800x800/1e293b/ffffff/png?text=G304+1',         NULL, 890000.00,   699000.00,   2, '2026-08-28 14:20:00'),
(2, 6, NULL, 'Samsung SSD 980 1TB NVMe PCIe 3.0',   'SSD-SS-980-1TB',      'https://placehold.co/800x800/1e293b/ffffff/png?text=SSD+980+1',      NULL, 1890000.00,  1590000.00,  1, '2026-08-28 14:20:00'),
-- DD00003 (đã hủy)
(3, 5, NULL, 'Razer DeathAdder V3',                 'MS-RAZER-DAV3',       'https://placehold.co/800x800/1e293b/ffffff/png?text=DeathAdder+V3+1', NULL, 1690000.00, 1690000.00,  1, '2026-09-03 16:45:00'),
-- DD00004
(4, 11, NULL, 'Kingston FURY Beast 16GB DDR4 3200MHz', 'RAM-KS-FB16-3200', 'https://placehold.co/800x800/1e293b/ffffff/png?text=FURY+Beast+1',   NULL, 1190000.00,  990000.00,   2, '2026-09-08 10:05:00'),
(4, 4,  NULL, 'Logitech G304 Lightspeed Wireless',  'MS-LOGI-G304',        'https://placehold.co/800x800/1e293b/ffffff/png?text=G304+1',         NULL, 890000.00,   699000.00,   1, '2026-09-08 10:05:00'),
-- DD00005
(5, 8, NULL, 'MSI GeForce RTX 5060 8G VENTUS 2X OC', 'GPU-MSI-RTX5060-V2X', 'https://placehold.co/800x800/1e293b/ffffff/png?text=RTX+5060+1',    NULL, 10990000.00, 9990000.00,  1, '2026-09-10 08:30:00'),
(5, 9, 1,    'Samsung Galaxy S25',                  'PH-SS-S25-256',       'https://placehold.co/800x800/1e293b/ffffff/png?text=Galaxy+S25+1',   '256GB - Xanh Navy', 22990000.00, 19990000.00, 1, '2026-09-10 08:30:00');

-- ---------------------------------------------------------------------
-- 5.13 order_status_history
-- ---------------------------------------------------------------------
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at) VALUES
(1, NULL,         'PENDING',    2, 'Khách đặt hàng',                    '2026-08-20 09:15:00'),
(1, 'PENDING',    'CONFIRMED',  1, 'Admin xác nhận',                    '2026-08-20 10:00:00'),
(1, 'CONFIRMED',  'PROCESSING', 1, 'Đóng gói',                          '2026-08-20 14:00:00'),
(1, 'PROCESSING', 'SHIPPING',   1, 'Giao cho đơn vị vận chuyển',        '2026-08-21 08:30:00'),
(1, 'SHIPPING',   'DELIVERED',  1, 'Giao thành công, đã thu COD',       '2026-08-22 15:30:00'),
(2, NULL,         'PENDING',    3, 'Khách đặt hàng, thanh toán VNPAY',  '2026-08-28 14:20:00'),
(2, 'PENDING',    'CONFIRMED',  1, NULL,                                 '2026-08-28 15:00:00'),
(2, 'CONFIRMED',  'PROCESSING', 1, NULL,                                 '2026-08-29 09:00:00'),
(2, 'PROCESSING', 'SHIPPING',   1, NULL,                                 '2026-08-29 16:00:00'),
(2, 'SHIPPING',   'DELIVERED',  1, NULL,                                 '2026-08-31 11:00:00'),
(3, NULL,         'PENDING',    2, 'Khách đặt hàng',                    '2026-09-03 16:45:00'),
(3, 'PENDING',    'CANCELLED',  2, 'Khách tự hủy: đổi ý, không mua nữa', '2026-09-03 18:00:00'),
(4, NULL,         'PENDING',    3, 'Khách đặt hàng',                    '2026-09-08 10:05:00'),
(4, 'PENDING',    'CONFIRMED',  1, 'Admin xác nhận',                    '2026-09-08 10:40:00'),
(5, NULL,         'PENDING',    2, 'Khách đặt hàng, thanh toán VNPAY',  '2026-09-10 08:30:00');

-- ---------------------------------------------------------------------
-- 5.14 payments
-- ---------------------------------------------------------------------
INSERT INTO payments (order_id, method, status, amount, transaction_code, gateway_response, paid_at, created_at) VALUES
(1, 'COD',   'PAID',   5380000.00,  NULL,          NULL,                                                                                     '2026-08-22 15:30:00', '2026-08-20 09:15:00'),
(2, 'VNPAY', 'PAID',   2988000.00,  'VNP14567890', JSON_OBJECT('vnp_ResponseCode','00','vnp_BankCode','NCB','vnp_TransactionNo','14567890'), '2026-08-28 14:25:00', '2026-08-28 14:20:00'),
(3, 'COD',   'UNPAID', 1720000.00,  NULL,          NULL,                                                                                     NULL,                  '2026-09-03 16:45:00'),
(4, 'COD',   'UNPAID', 2629000.00,  NULL,          NULL,                                                                                     NULL,                  '2026-09-08 10:05:00'),
(5, 'VNPAY', 'PAID',   29540000.00, 'VNP14589012', JSON_OBJECT('vnp_ResponseCode','00','vnp_BankCode','VCB','vnp_TransactionNo','14589012'), '2026-09-10 08:32:00', '2026-09-10 08:30:00');

-- ---------------------------------------------------------------------
-- 5.15 promotion_usages
-- ---------------------------------------------------------------------
INSERT INTO promotion_usages (promotion_id, user_id, order_id, discount_amount, created_at) VALUES
(1, 2, 1, 500000.00, '2026-08-20 09:15:00'),
(3, 3, 4, 50000.00,  '2026-09-08 10:05:00'),
(1, 2, 5, 500000.00, '2026-09-10 08:30:00');

-- ---------------------------------------------------------------------
-- 5.16 reviews (chỉ từ đơn đã DELIVERED)
-- ---------------------------------------------------------------------
INSERT INTO reviews (user_id, product_id, order_id, rating, comment, is_verified_purchase, admin_reply, replied_at, status, created_at) VALUES
(2, 1, 1, 5, 'Main ổn định, BIOS dễ dùng, WiFi 6 bắt sóng tốt. Đóng gói cẩn thận.',      1, 'Cảm ơn anh đã tin tưởng DDTECH!', '2026-08-26 09:00:00', 'APPROVED', '2026-08-25 20:10:00'),
(2, 2, 1, 4, 'Hiệu năng tốt trong tầm giá, tản stock hơi ồn khi tải nặng.',               1, NULL, NULL, 'APPROVED', '2026-08-25 20:15:00'),
(3, 4, 2, 5, 'Chuột nhẹ, pin trâu, giá tốt. Rất đáng mua.',                                1, NULL, NULL, 'APPROVED', '2026-09-01 12:30:00'),
(3, 6, 2, 4, 'Tốc độ nhanh, cài Windows chỉ hơn 1 phút.',                                  1, NULL, NULL, 'APPROVED', '2026-09-01 12:35:00');

-- ---------------------------------------------------------------------
-- 5.17 notifications
-- ---------------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id, is_read, read_at, created_at) VALUES
(1, 'Có đơn hàng mới #DD00001', 'Nguyễn Văn An vừa đặt đơn DD00001 trị giá 5.380.000đ (COD).',   'ORDER', 'order', 1, 1, '2026-08-20 09:50:00', '2026-08-20 09:15:00'),
(1, 'Có đơn hàng mới #DD00002', 'Trần Thị Bình vừa đặt đơn DD00002 trị giá 2.988.000đ (VNPAY).', 'ORDER', 'order', 2, 1, '2026-08-28 14:55:00', '2026-08-28 14:20:00'),
(1, 'Đơn hàng DD00003 đã bị hủy', 'Khách hàng Nguyễn Văn An đã hủy đơn DD00003.',                 'ORDER', 'order', 3, 1, '2026-09-03 18:30:00', '2026-09-03 18:00:00'),
(1, 'Có đơn hàng mới #DD00004', 'Trần Thị Bình vừa đặt đơn DD00004 trị giá 2.629.000đ (COD).',   'ORDER', 'order', 4, 1, '2026-09-08 10:35:00', '2026-09-08 10:05:00'),
(1, 'Có đơn hàng mới #DD00005', 'Nguyễn Văn An vừa đặt đơn DD00005 trị giá 29.540.000đ (VNPAY).', 'ORDER', 'order', 5, 0, NULL, '2026-09-10 08:30:00'),
(2, 'Đặt hàng thành công',        'Đơn hàng DD00001 đã được tạo, đang chờ xác nhận.',             'ORDER', 'order', 1, 1, '2026-08-20 09:20:00', '2026-08-20 09:15:00'),
(2, 'Đơn hàng đã được xác nhận',  'Đơn hàng DD00001 đã được xác nhận.',                           'ORDER', 'order', 1, 1, '2026-08-20 10:30:00', '2026-08-20 10:00:00'),
(2, 'Giao hàng thành công',       'Đơn hàng DD00001 đã được giao thành công. Hãy đánh giá sản phẩm nhé!', 'ORDER', 'order', 1, 1, '2026-08-22 18:00:00', '2026-08-22 15:30:00'),
(2, 'Đơn hàng đã hủy',            'Đơn hàng DD00003 đã được hủy theo yêu cầu của bạn.',           'ORDER', 'order', 3, 1, '2026-09-03 18:01:00', '2026-09-03 18:00:00'),
(2, 'Thanh toán thành công',      'Thanh toán VNPAY cho đơn DD00005 thành công (29.540.000đ).',   'PAYMENT', 'order', 5, 0, NULL, '2026-09-10 08:32:00'),
(3, 'Giao hàng thành công',       'Đơn hàng DD00002 đã được giao thành công.',                    'ORDER', 'order', 2, 1, '2026-08-31 12:00:00', '2026-08-31 11:00:00'),
(3, 'Đơn hàng đã được xác nhận',  'Đơn hàng DD00004 đã được xác nhận, shop đang chuẩn bị hàng.',  'ORDER', 'order', 4, 0, NULL, '2026-09-08 10:40:00'),
(3, 'Ưu đãi dành cho bạn',        'Nhập mã DDTECH10 giảm 10% (tối đa 500.000đ) cho đơn từ 2.000.000đ.', 'PROMOTION', 'promotion', 1, 0, NULL, '2026-09-09 09:00:00');

-- ---------------------------------------------------------------------
-- 5.18 inventory_transactions (IMPORT đầu kỳ + SALE/CANCEL theo đơn mẫu)
--      Kiểm tra: stock hiện tại của products/variants = IMPORT + tổng biến động
-- ---------------------------------------------------------------------
INSERT INTO inventory_transactions (product_id, variant_id, type, quantity, stock_after, reference_type, reference_id, note, created_by, created_at) VALUES
-- Nhập kho đầu kỳ 01/08/2026
(1,  NULL, 'IMPORT', 26,  26,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(2,  NULL, 'IMPORT', 41,  41,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(3,  NULL, 'IMPORT', 30,  30,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(4,  NULL, 'IMPORT', 103, 103, NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(5,  NULL, 'IMPORT', 35,  35,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(6,  NULL, 'IMPORT', 61,  61,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(7,  NULL, 'IMPORT', 5,   5,   NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(8,  NULL, 'IMPORT', 13,  13,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-05 08:00:00'),
(9,  1,    'IMPORT', 10,  10,  NULL, NULL, 'Nhập kho đầu kỳ - S25 256GB', 1, '2026-08-05 08:00:00'),
(9,  2,    'IMPORT', 5,   5,   NULL, NULL, 'Nhập kho đầu kỳ - S25 512GB', 1, '2026-08-05 08:00:00'),
(10, 3,    'IMPORT', 8,   8,   NULL, NULL, 'Nhập kho đầu kỳ - iPhone 16 128GB', 1, '2026-08-05 08:00:00'),
(10, 4,    'IMPORT', 6,   6,   NULL, NULL, 'Nhập kho đầu kỳ - iPhone 16 256GB', 1, '2026-08-05 08:00:00'),
(11, NULL, 'IMPORT', 82,  82,  NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-01 08:00:00'),
(12, NULL, 'IMPORT', 3,   3,   NULL, NULL, 'Nhập kho đầu kỳ', 1, '2026-08-08 08:00:00'),
-- DD00001
(1,  NULL, 'SALE', -1, 25,  'order', 1, 'Bán theo đơn DD00001', NULL, '2026-08-20 09:15:00'),
(2,  NULL, 'SALE', -1, 40,  'order', 1, 'Bán theo đơn DD00001', NULL, '2026-08-20 09:15:00'),
-- DD00002
(4,  NULL, 'SALE', -2, 101, 'order', 2, 'Bán theo đơn DD00002', NULL, '2026-08-28 14:20:00'),
(6,  NULL, 'SALE', -1, 60,  'order', 2, 'Bán theo đơn DD00002', NULL, '2026-08-28 14:20:00'),
-- DD00003 (bán rồi hoàn kho do hủy)
(5,  NULL, 'SALE',         -1, 34, 'order', 3, 'Bán theo đơn DD00003',         NULL, '2026-09-03 16:45:00'),
(5,  NULL, 'CANCEL_ORDER',  1, 35, 'order', 3, 'Hoàn kho do hủy đơn DD00003',  2,    '2026-09-03 18:00:00'),
-- DD00004
(11, NULL, 'SALE', -2, 80,  'order', 4, 'Bán theo đơn DD00004', NULL, '2026-09-08 10:05:00'),
(4,  NULL, 'SALE', -1, 100, 'order', 4, 'Bán theo đơn DD00004', NULL, '2026-09-08 10:05:00'),
-- DD00005
(8,  NULL, 'SALE', -1, 12,  'order', 5, 'Bán theo đơn DD00005', NULL, '2026-09-10 08:30:00'),
(9,  1,    'SALE', -1, 9,   'order', 5, 'Bán theo đơn DD00005 - S25 256GB', NULL, '2026-09-10 08:30:00');

-- ---------------------------------------------------------------------
-- 5.19 carts & cart_items
-- ---------------------------------------------------------------------
INSERT INTO carts (id, user_id, created_at) VALUES
(1, 2, '2026-08-10 09:30:00'),
(2, 3, '2026-08-15 14:00:00'),
(3, 4, '2026-08-18 19:45:00');

INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, created_at) VALUES
(1, 3,  NULL, 1, '2026-09-09 21:00:00'),
(1, 10, 3,    1, '2026-09-09 21:05:00'),
(2, 7,  NULL, 1, '2026-09-08 11:00:00');

-- ---------------------------------------------------------------------
-- 5.20 favorites
-- ---------------------------------------------------------------------
INSERT INTO favorites (user_id, product_id, created_at) VALUES
(2, 8,  '2026-08-12 10:00:00'),
(2, 12, '2026-08-12 10:02:00'),
(3, 9,  '2026-08-16 08:00:00'),
(3, 4,  '2026-08-16 08:05:00');

-- ---------------------------------------------------------------------
-- 5.21 banners
-- ---------------------------------------------------------------------
INSERT INTO banners (title, image_url, link_type, link_value, position, sort_order, status, start_date, end_date) VALUES
('RTX 5060 - Sẵn hàng, giảm 1 triệu', 'https://placehold.co/1200x500/0f172a/ffffff/png?text=RTX+5060+Sale', 'PRODUCT',  '8',        'HOME_SLIDER', 1, 'ACTIVE', '2026-09-01 00:00:00', '2026-09-30 23:59:59'),
('Galaxy S25 - Trả góp 0%',          'https://placehold.co/1200x500/1e3a8a/ffffff/png?text=Galaxy+S25',    'PRODUCT',  '9',        'HOME_SLIDER', 2, 'ACTIVE', '2026-09-01 00:00:00', '2026-09-30 23:59:59'),
('Linh kiện PC giảm đến 20%',        'https://placehold.co/1200x500/7c2d12/ffffff/png?text=PC+Components',  'CATEGORY', '6',        'HOME_SLIDER', 3, 'ACTIVE', NULL, NULL);

-- =====================================================================
-- HẾT FILE
-- =====================================================================
