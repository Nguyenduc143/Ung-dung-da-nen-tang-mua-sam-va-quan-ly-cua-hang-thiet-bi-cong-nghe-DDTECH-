DELIMITER $$

DROP PROCEDURE IF EXISTS sp_report_getrevenue_1$$
CREATE PROCEDURE sp_report_getrevenue_1(
  IN p_from DATETIME,
  IN p_to DATETIME,
  IN p_group_by VARCHAR(10)
)
SQL SECURITY INVOKER
BEGIN
  IF p_group_by = 'MONTH' THEN
    SELECT DATE_FORMAT(o.delivered_at, '%Y-%m') AS periodLabel,
           COALESCE(SUM(o.total_amount), 0) AS revenue,
           COUNT(*) AS ordersCount,
           COALESCE(SUM(o.subtotal), 0) AS subtotal,
           COALESCE(SUM(o.shipping_fee), 0) AS shippingFee,
           COALESCE(SUM(o.discount_amount), 0) AS discountAmount
    FROM orders o
    WHERE o.status = 'DELIVERED'
      AND o.delivered_at >= p_from AND o.delivered_at <= p_to
    GROUP BY DATE_FORMAT(o.delivered_at, '%Y-%m')
    ORDER BY periodLabel;
  ELSE
    SELECT DATE_FORMAT(o.delivered_at, '%Y-%m-%d') AS periodLabel,
           COALESCE(SUM(o.total_amount), 0) AS revenue,
           COUNT(*) AS ordersCount,
           COALESCE(SUM(o.subtotal), 0) AS subtotal,
           COALESCE(SUM(o.shipping_fee), 0) AS shippingFee,
           COALESCE(SUM(o.discount_amount), 0) AS discountAmount
    FROM orders o
    WHERE o.status = 'DELIVERED'
      AND o.delivered_at >= p_from AND o.delivered_at <= p_to
    GROUP BY DATE_FORMAT(o.delivered_at, '%Y-%m-%d')
    ORDER BY periodLabel;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_report_getorders_1$$
CREATE PROCEDURE sp_report_getorders_1(
  IN p_from DATETIME,
  IN p_to DATETIME,
  IN p_status VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
SQL SECURITY INVOKER
BEGIN
  SELECT o.id, o.order_code AS orderCode, o.user_id AS userId,
         u.full_name AS customerName, u.email AS customerEmail,
         o.receiver_name AS receiverName, o.receiver_phone AS receiverPhone,
         o.subtotal, o.shipping_fee AS shippingFee,
         o.discount_amount AS discountAmount, o.total_amount AS totalAmount,
         o.payment_method AS paymentMethod, o.payment_status AS paymentStatus,
         o.status, o.created_at AS createdAt, o.delivered_at AS deliveredAt,
         COUNT(*) OVER() AS totalRows
  FROM orders o
  INNER JOIN users u ON u.id = o.user_id
  WHERE o.created_at >= p_from AND o.created_at <= p_to
    AND (p_status IS NULL OR o.status = p_status)
  ORDER BY o.created_at DESC, o.id DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_report_getproducts_1$$
CREATE PROCEDURE sp_report_getproducts_1(
  IN p_from DATETIME,
  IN p_to DATETIME,
  IN p_category_id BIGINT UNSIGNED,
  IN p_brand_id BIGINT UNSIGNED,
  IN p_limit INT
)
SQL SECURITY INVOKER
BEGIN
  SELECT MAX(oi.product_id) AS productId, MAX(oi.product_name) AS productName,
         MAX(oi.product_sku) AS productSku, MAX(c.name) AS categoryName,
         MAX(b.name) AS brandName, SUM(oi.quantity) AS quantitySold,
         COALESCE(SUM(oi.subtotal), 0) AS grossRevenue,
         COUNT(DISTINCT oi.order_id) AS ordersCount,
         COALESCE(AVG(oi.price), 0) AS averagePrice
  FROM order_items oi
  INNER JOIN orders o ON o.id = oi.order_id
  LEFT JOIN products p ON p.id = oi.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
  WHERE o.status = 'DELIVERED'
    AND o.delivered_at >= p_from AND o.delivered_at <= p_to
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
  GROUP BY COALESCE(CAST(oi.product_id AS CHAR), CONCAT('sku:', oi.product_sku))
  ORDER BY quantitySold DESC, grossRevenue DESC, productName
  LIMIT p_limit;
END$$

DROP PROCEDURE IF EXISTS sp_report_getinventory_1$$
CREATE PROCEDURE sp_report_getinventory_1(
  IN p_from DATETIME,
  IN p_to DATETIME,
  IN p_type VARCHAR(20),
  IN p_product_id BIGINT UNSIGNED,
  IN p_limit INT,
  IN p_offset INT
)
SQL SECURITY INVOKER
BEGIN
  SELECT it.id, it.product_id AS productId, p.name AS productName,
         p.sku AS productSku, it.variant_id AS variantId,
         pv.variant_name AS variantName, pv.sku AS variantSku,
         it.type, it.quantity, it.stock_after AS stockAfter,
         it.reference_type AS referenceType, it.reference_id AS referenceId,
         it.note, it.created_by AS createdBy, u.full_name AS createdByName,
         it.created_at AS createdAt, COUNT(*) OVER() AS totalRows
  FROM inventory_transactions it
  INNER JOIN products p ON p.id = it.product_id
  LEFT JOIN product_variants pv ON pv.id = it.variant_id
  LEFT JOIN users u ON u.id = it.created_by
  WHERE it.created_at >= p_from AND it.created_at <= p_to
    AND (p_type IS NULL OR it.type = p_type)
    AND (p_product_id IS NULL OR it.product_id = p_product_id)
  ORDER BY it.created_at DESC, it.id DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_migration_report_indexes_1$$
CREATE PROCEDURE sp_migration_report_indexes_1()
SQL SECURITY INVOKER
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
      AND INDEX_NAME = 'idx_orders_status_delivered'
  ) THEN
    SET @report_index_sql = 'ALTER TABLE orders ADD INDEX idx_orders_status_delivered (status, delivered_at)';
    PREPARE report_index_stmt FROM @report_index_sql;
    EXECUTE report_index_stmt;
    DEALLOCATE PREPARE report_index_stmt;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_transactions'
      AND INDEX_NAME = 'idx_inventory_created_type'
  ) THEN
    SET @report_index_sql = 'ALTER TABLE inventory_transactions ADD INDEX idx_inventory_created_type (created_at, type)';
    PREPARE report_index_stmt FROM @report_index_sql;
    EXECUTE report_index_stmt;
    DEALLOCATE PREPARE report_index_stmt;
  END IF;
END$$

CALL sp_migration_report_indexes_1()$$
DROP PROCEDURE IF EXISTS sp_migration_report_indexes_1$$

DELIMITER ;
