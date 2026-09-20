-- Generated from static repository statements. Dynamic queries are migrated separately.
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_address_listbyuser_1$$
CREATE PROCEDURE sp_address_listbyuser_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, user_id, receiver_name, receiver_phone, province, district,
  ward, address_line, address_type, is_default, created_at, updated_at FROM addresses
     WHERE user_id = p_1 ORDER BY is_default DESC, created_at DESC;
END$$

DROP PROCEDURE IF EXISTS sp_address_findownedbyid_1$$
CREATE PROCEDURE sp_address_findownedbyid_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, user_id, receiver_name, receiver_phone, province, district,
  ward, address_line, address_type, is_default, created_at, updated_at FROM addresses
     WHERE id = p_1 AND user_id = p_2 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_address_cleardefault_1$$
CREATE PROCEDURE sp_address_cleardefault_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE addresses SET is_default = 0 WHERE user_id = p_1 AND is_default = 1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_address_createaddress_1$$
CREATE PROCEDURE sp_address_createaddress_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT, IN p_7 LONGTEXT, IN p_8 LONGTEXT, IN p_9 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO addresses
       (user_id, receiver_name, receiver_phone, province, district, ward,
        address_line, address_type, is_default)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6, p_7, p_8, p_9);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_address_deleteownedaddress_1$$
CREATE PROCEDURE sp_address_deleteownedaddress_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM addresses WHERE id = p_1 AND user_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_address_setdefault_1$$
CREATE PROCEDURE sp_address_setdefault_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE addresses SET is_default = 1 WHERE id = p_1 AND user_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_auth_findexistingidentity_1$$
CREATE PROCEDURE sp_auth_findexistingidentity_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT email, phone FROM users WHERE email = p_1 OR phone = p_2 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_auth_createcustomer_1$$
CREATE PROCEDURE sp_auth_createcustomer_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES (p_1, p_2, p_3, p_4, 'CUSTOMER');
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_auth_finduserforlogin_1$$
CREATE PROCEDURE sp_auth_finduserforlogin_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, full_name, email, phone, password_hash, avatar_url, role, status,
            deleted_at, created_at, updated_at
     FROM users
     WHERE email = p_1
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_auth_findactiveuserbyid_1$$
CREATE PROCEDURE sp_auth_findactiveuserbyid_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, full_name, email, phone, avatar_url, role, status, last_login_at,
            created_at, updated_at
     FROM users
     WHERE id = p_1 AND status = 'ACTIVE' AND deleted_at IS NULL
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_auth_updatelastlogin_1$$
CREATE PROCEDURE sp_auth_updatelastlogin_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_auth_createrefreshtoken_1$$
CREATE PROCEDURE sp_auth_createrefreshtoken_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO refresh_tokens
       (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (p_1, p_2, p_3, p_4, p_5);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_auth_findusablerefreshtokenforupdate_1$$
CREATE PROCEDURE sp_auth_findusablerefreshtokenforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT rt.id, rt.user_id, u.role
     FROM refresh_tokens rt
     INNER JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = p_1
       AND rt.revoked_at IS NULL
       AND rt.expires_at > CURRENT_TIMESTAMP
       AND u.status = 'ACTIVE'
       AND u.deleted_at IS NULL
     LIMIT 1
     FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_auth_revokerefreshtokenbyid_1$$
CREATE PROCEDURE sp_auth_revokerefreshtokenbyid_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = p_1 AND revoked_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_auth_revokerefreshtoken_1$$
CREATE PROCEDURE sp_auth_revokerefreshtoken_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = p_1 AND token_hash = p_2 AND revoked_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_auth_revokeallrefreshtokens_1$$
CREATE PROCEDURE sp_auth_revokeallrefreshtokens_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = p_1 AND revoked_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_getorcreatecart_1$$
CREATE PROCEDURE sp_cart_getorcreatecart_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO carts (user_id) VALUES (p_1)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_findcartbyuser_1$$
CREATE PROCEDURE sp_cart_findcartbyuser_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, user_id AS userId, created_at AS createdAt, updated_at AS updatedAt
     FROM carts WHERE user_id = p_1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_cart_findproductforupdate_1$$
CREATE PROCEDURE sp_cart_findproductforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, has_variants AS hasVariants, stock, status, deleted_at AS deletedAt
     FROM products WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_cart_findvariantforupdate_1$$
CREATE PROCEDURE sp_cart_findvariantforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, stock, status
     FROM product_variants WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_cart_findcartitemforupdate_1$$
CREATE PROCEDURE sp_cart_findcartitemforupdate_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, cart_id AS cartId, product_id AS productId,
            variant_id AS variantId, quantity
     FROM cart_items
     WHERE cart_id = p_1 AND product_id = p_2 AND variant_id <=> p_3
     LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_cart_findownedcartitemforupdate_1$$
CREATE PROCEDURE sp_cart_findownedcartitemforupdate_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, cart_id AS cartId, product_id AS productId,
            variant_id AS variantId, quantity
     FROM cart_items WHERE id = p_1 AND cart_id = p_2 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_cart_createcartitem_1$$
CREATE PROCEDURE sp_cart_createcartitem_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
     VALUES (p_1, p_2, p_3, p_4);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_updatecartitemquantity_1$$
CREATE PROCEDURE sp_cart_updatecartitemquantity_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE cart_items SET quantity = p_1 WHERE id = p_2 AND cart_id = p_3;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_deletecartitem_1$$
CREATE PROCEDURE sp_cart_deletecartitem_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM cart_items WHERE id = p_1 AND cart_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_clearcart_1$$
CREATE PROCEDURE sp_cart_clearcart_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM cart_items WHERE cart_id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_touchcart_1$$
CREATE PROCEDURE sp_cart_touchcart_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_cart_listcartitems_1$$
CREATE PROCEDURE sp_cart_listcartitems_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT ci.id, ci.quantity, ci.created_at AS createdAt, ci.updated_at AS updatedAt,
            p.id AS productId, p.name AS productName, p.slug AS productSlug,
            p.sku AS productSku, p.status AS productStatus,
            p.deleted_at AS productDeletedAt, p.has_variants AS hasVariants,
            p.price AS productPrice, p.sale_price AS productSalePrice,
            p.stock AS productStock, p.rating_avg AS ratingAvg,
            p.review_count AS reviewCount,
            pv.id AS variantId, pv.variant_name AS variantName, pv.sku AS variantSku,
            pv.attributes AS variantAttributes, pv.price AS variantPrice,
            pv.sale_price AS variantSalePrice, pv.stock AS variantStock,
            pv.status AS variantStatus,
            CASE WHEN ci.variant_id IS NULL
                 THEN COALESCE(p.sale_price, p.price)
                 ELSE COALESCE(pv.sale_price, pv.price)
            END AS currentPrice,
            CASE WHEN ci.variant_id IS NULL THEN p.stock ELSE pv.stock END AS availableStock,
            COALESCE(
              pv.image_url,
              (SELECT pi.image_url FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY (pi.variant_id = ci.variant_id) DESC,
                        pi.is_primary DESC, pi.sort_order, pi.id
               LIMIT 1)
            ) AS imageUrl
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE ci.cart_id = p_1
     ORDER BY ci.created_at DESC, ci.id DESC;
END$$

DROP PROCEDURE IF EXISTS sp_catalog_locktree_1$$
CREATE PROCEDURE sp_catalog_locktree_1()
SQL SECURITY INVOKER
BEGIN
  SELECT id, parent_id AS parentId, deleted_at AS deletedAt FROM categories ORDER BY id FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_dashboard_getsummary_1$$
CREATE PROCEDURE sp_dashboard_getsummary_1()
SQL SECURITY INVOKER
BEGIN
  SELECT
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders
        WHERE status = 'DELIVERED') AS totalRevenue,
       (SELECT COUNT(*) FROM orders) AS ordersCount,
       (SELECT COUNT(*) FROM users
        WHERE role = 'CUSTOMER' AND deleted_at IS NULL) AS customerCount,
       (SELECT COUNT(*) FROM products
        WHERE deleted_at IS NULL) AS productCount,
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders
        WHERE status = 'DELIVERED' AND delivered_at >= CURDATE()
          AND delivered_at < CURDATE() + INTERVAL 1 DAY) AS todayRevenue,
       (SELECT COUNT(*) FROM orders WHERE status = 'PENDING') AS pendingOrders;
END$$

DROP PROCEDURE IF EXISTS sp_dashboard_getordersbystatus_1$$
CREATE PROCEDURE sp_dashboard_getordersbystatus_1()
SQL SECURITY INVOKER
BEGIN
  SELECT status, COUNT(*) AS ordersCount
     FROM orders GROUP BY status ORDER BY status;
END$$

DROP PROCEDURE IF EXISTS sp_dashboard_gettopproducts_1$$
CREATE PROCEDURE sp_dashboard_gettopproducts_1(IN p_1 BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  SELECT MAX(oi.product_id) AS productId, MAX(oi.product_name) AS productName,
            MAX(oi.product_sku) AS productSku, SUM(oi.quantity) AS quantitySold,
            SUM(oi.subtotal) AS revenue, COUNT(DISTINCT oi.order_id) AS ordersCount
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'DELIVERED'
     GROUP BY COALESCE(CONCAT('id:', oi.product_id), CONCAT('sku:', oi.product_sku))
     ORDER BY quantitySold DESC, revenue DESC, productSku
     LIMIT p_1;
END$$

DROP PROCEDURE IF EXISTS sp_dashboard_getrecentorders_1$$
CREATE PROCEDURE sp_dashboard_getrecentorders_1(IN p_1 BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  SELECT o.id, o.order_code AS orderCode, o.user_id AS userId,
            u.full_name AS customerName, o.receiver_name AS receiverName,
            o.total_amount AS totalAmount, o.payment_method AS paymentMethod,
            o.payment_status AS paymentStatus, o.status, o.created_at AS createdAt
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT p_1;
END$$

DROP PROCEDURE IF EXISTS sp_favorite_listbyuser_1$$
CREATE PROCEDURE sp_favorite_listbyuser_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT f.id, f.created_at AS createdAt, p.id AS productId,
            p.name, p.slug, p.sku, p.short_description AS shortDescription,
            p.price, p.sale_price AS salePrice, p.stock,
            p.has_variants AS hasVariants, p.rating_avg AS ratingAvg,
            p.review_count AS reviewCount, c.id AS categoryId,
            c.name AS categoryName, c.slug AS categorySlug,
            b.id AS brandId, b.name AS brandName, b.slug AS brandSlug,
            (SELECT pi.image_url FROM product_images pi
             WHERE pi.product_id = p.id
             ORDER BY pi.is_primary DESC, pi.sort_order, pi.id LIMIT 1) AS imageUrl
     FROM favorites f
     INNER JOIN products p ON p.id = f.product_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE f.user_id = p_1 AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
     ORDER BY f.created_at DESC, f.id DESC;
END$$

DROP PROCEDURE IF EXISTS sp_favorite_findproductforupdate_1$$
CREATE PROCEDURE sp_favorite_findproductforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, status, deleted_at AS deletedAt
     FROM products WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_favorite_findfavorite_1$$
CREATE PROCEDURE sp_favorite_findfavorite_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM favorites
     WHERE user_id = p_1 AND product_id = p_2 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_favorite_createfavorite_1$$
CREATE PROCEDURE sp_favorite_createfavorite_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO favorites (user_id, product_id) VALUES (p_1, p_2);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_favorite_deletefavorite_1$$
CREATE PROCEDURE sp_favorite_deletefavorite_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM favorites WHERE user_id = p_1 AND product_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_listlowstock_1$$
CREATE PROCEDURE sp_inventory_listlowstock_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT p.id AS productId, p.name AS productName, p.sku AS productSku,
            NULL AS variantId, NULL AS variantName, NULL AS variantSku, p.stock
     FROM products p
     WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE'
       AND p.has_variants = 0 AND p.stock <= p_1
     UNION ALL
     SELECT p.id, p.name, p.sku, pv.id, pv.variant_name, pv.sku, pv.stock
     FROM products p
     INNER JOIN product_variants pv ON pv.product_id = p.id
     WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE'
       AND p.has_variants = 1 AND pv.status = 'ACTIVE' AND pv.stock <= p_2
     ORDER BY stock, productId, variantId;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_findproductforupdate_1$$
CREATE PROCEDURE sp_inventory_findproductforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, name, slug, sku, stock, sold_count AS soldCount,
  has_variants AS hasVariants, status, deleted_at AS deletedAt,
  updated_at AS updatedAt FROM products WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_findvariantforupdate_1$$
CREATE PROCEDURE sp_inventory_findvariantforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, sku,
  variant_name AS variantName, stock, sold_count AS soldCount,
  status, updated_at AS updatedAt FROM product_variants
     WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_updateproductstock_1$$
CREATE PROCEDURE sp_inventory_updateproductstock_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products SET stock = p_1 WHERE id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_updatevariantstock_1$$
CREATE PROCEDURE sp_inventory_updatevariantstock_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE product_variants SET stock = p_1 WHERE id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_sumvariantstock_1$$
CREATE PROCEDURE sp_inventory_sumvariantstock_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT COALESCE(SUM(stock), 0) AS total FROM product_variants WHERE product_id = p_1;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_createtransaction_1$$
CREATE PROCEDURE sp_inventory_createtransaction_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT, IN p_7 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO inventory_transactions
       (product_id, variant_id, type, quantity, stock_after, note, created_by)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6, p_7);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_inventory_findtransaction_1$$
CREATE PROCEDURE sp_inventory_findtransaction_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT it.id, it.product_id AS productId, p.name AS productName,
            p.sku AS productSku, it.variant_id AS variantId,
            pv.variant_name AS variantName, pv.sku AS variantSku,
            it.type, it.quantity, it.stock_after AS stockAfter,
            it.reference_type AS referenceType, it.reference_id AS referenceId,
            it.note, it.created_by AS createdBy, u.full_name AS createdByName,
            it.created_at AS createdAt
     FROM inventory_transactions it
     INNER JOIN products p ON p.id = it.product_id
     LEFT JOIN product_variants pv ON pv.id = it.variant_id
     LEFT JOIN users u ON u.id = it.created_by
     WHERE it.id = p_1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_notification_countunread_1$$
CREATE PROCEDURE sp_notification_countunread_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT COUNT(*) AS total FROM notifications WHERE user_id = p_1 AND is_read = 0;
END$$

DROP PROCEDURE IF EXISTS sp_notification_markread_1$$
CREATE PROCEDURE sp_notification_markread_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE notifications
     SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = p_1 AND user_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_notification_markallread_1$$
CREATE PROCEDURE sp_notification_markallread_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP
     WHERE user_id = p_1 AND is_read = 0;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_findcartforupdate_1$$
CREATE PROCEDURE sp_order_findcartforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM carts WHERE user_id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_listcartitemsforupdate_1$$
CREATE PROCEDURE sp_order_listcartitemsforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, variant_id AS variantId, quantity
     FROM cart_items WHERE cart_id = p_1
     ORDER BY product_id, variant_key FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_findproductforupdate_1$$
CREATE PROCEDURE sp_order_findproductforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, name, sku, price, sale_price AS salePrice, stock,
            sold_count AS soldCount, has_variants AS hasVariants,
            status, deleted_at AS deletedAt
     FROM products WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_findvariantforupdate_1$$
CREATE PROCEDURE sp_order_findvariantforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, sku, variant_name AS variantName,
            price, sale_price AS salePrice, stock, sold_count AS soldCount,
            image_url AS imageUrl, status
     FROM product_variants WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_findproductimage_1$$
CREATE PROCEDURE sp_order_findproductimage_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT image_url AS imageUrl FROM product_images
     WHERE product_id = p_1
     ORDER BY (variant_id = p_2) DESC, is_primary DESC, sort_order, id
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_order_findownedaddress_1$$
CREATE PROCEDURE sp_order_findownedaddress_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT receiver_name AS receiverName, receiver_phone AS receiverPhone,
            province, district, ward, address_line AS addressLine
     FROM addresses WHERE id = p_1 AND user_id = p_2 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_order_findshippingmethodforupdate_1$$
CREATE PROCEDURE sp_order_findshippingmethodforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, code, name, base_fee AS baseFee, free_threshold AS freeThreshold,
            estimated_days_min AS estimatedDaysMin,
            estimated_days_max AS estimatedDaysMax
     FROM shipping_methods
     WHERE id = p_1 AND status = 'ACTIVE' LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_lockpromotion_1$$
CREATE PROCEDURE sp_order_lockpromotion_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM promotions WHERE id = p_1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_createorder_1$$
CREATE PROCEDURE sp_order_createorder_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT, IN p_7 LONGTEXT, IN p_8 LONGTEXT, IN p_9 LONGTEXT, IN p_10 LONGTEXT, IN p_11 LONGTEXT, IN p_12 LONGTEXT, IN p_13 LONGTEXT, IN p_14 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO orders
       (order_code, user_id, receiver_name, receiver_phone, shipping_address,
        shipping_method_id, promotion_id, promotion_code, subtotal, shipping_fee,
        discount_amount, total_amount, payment_method, payment_status, status, note)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6, p_7, p_8, p_9, p_10, p_11, p_12, p_13, 'UNPAID', 'PENDING', p_14);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createorderitem_1$$
CREATE PROCEDURE sp_order_createorderitem_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT, IN p_7 LONGTEXT, IN p_8 LONGTEXT, IN p_9 LONGTEXT, IN p_10 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO order_items
       (order_id, product_id, variant_id, product_name, product_sku, product_image,
        variant_name, original_price, price, quantity)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6, p_7, p_8, p_9, p_10);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_decreaseproductinventory_1$$
CREATE PROCEDURE sp_order_decreaseproductinventory_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products
     SET stock = stock - p_1, sold_count = sold_count + p_2
     WHERE id = p_3 AND stock >= p_4;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_decreasevariantinventory_1$$
CREATE PROCEDURE sp_order_decreasevariantinventory_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE product_variants
     SET stock = stock - p_1, sold_count = sold_count + p_2
     WHERE id = p_3 AND stock >= p_4;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_restoreproductinventory_1$$
CREATE PROCEDURE sp_order_restoreproductinventory_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products
     SET stock = stock + p_1, sold_count = GREATEST(sold_count - p_2, 0)
     WHERE id = p_3;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_restorevariantinventory_1$$
CREATE PROCEDURE sp_order_restorevariantinventory_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE product_variants
     SET stock = stock + p_1, sold_count = GREATEST(sold_count - p_2, 0)
     WHERE id = p_3;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createinventorytransaction_1$$
CREATE PROCEDURE sp_order_createinventorytransaction_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT, IN p_7 LONGTEXT, IN p_8 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO inventory_transactions
       (product_id, variant_id, type, quantity, stock_after, reference_type,
        reference_id, note, created_by)
     VALUES (p_1, p_2, p_3, p_4, p_5, 'order', p_6, p_7, p_8);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createpromotionusage_1$$
CREATE PROCEDURE sp_order_createpromotionusage_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO promotion_usages
       (promotion_id, user_id, order_id, discount_amount)
     VALUES (p_1, p_2, p_3, p_4);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createpromotionusage_2$$
CREATE PROCEDURE sp_order_createpromotionusage_2(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE promotions SET used_count = used_count + 1 WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_releasepromotionusage_1$$
CREATE PROCEDURE sp_order_releasepromotionusage_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM promotion_usages WHERE promotion_id = p_1 AND order_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_releasepromotionusage_2$$
CREATE PROCEDURE sp_order_releasepromotionusage_2(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE promotions SET used_count = GREATEST(used_count - 1, 0) WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createstatushistory_1$$
CREATE PROCEDURE sp_order_createstatushistory_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO order_status_history
       (order_id, from_status, to_status, changed_by, note)
     VALUES (p_1, p_2, p_3, p_4, p_5);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_clearcartitems_1$$
CREATE PROCEDURE sp_order_clearcartitems_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM cart_items WHERE cart_id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_clearcartitems_2$$
CREATE PROCEDURE sp_order_clearcartitems_2(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createnotification_1$$
CREATE PROCEDURE sp_order_createnotification_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO notifications
       (user_id, title, message, type, reference_type, reference_id)
     VALUES (p_1, p_2, p_3, 'ORDER', 'order', p_4);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_createadminnotifications_1$$
CREATE PROCEDURE sp_order_createadminnotifications_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO notifications
       (user_id, title, message, type, reference_type, reference_id)
     SELECT id, p_1, p_2, 'ORDER', 'order', p_3
     FROM users
     WHERE role = 'ADMIN' AND status = 'ACTIVE' AND deleted_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_order_listorderitems_1$$
CREATE PROCEDURE sp_order_listorderitems_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, order_id AS orderId, product_id AS productId,
            variant_id AS variantId, product_name AS productName,
            product_sku AS productSku, product_image AS productImage,
            variant_name AS variantName, original_price AS originalPrice,
            price, quantity, subtotal, created_at AS createdAt
     FROM order_items WHERE order_id = p_1 ORDER BY id;
END$$

DROP PROCEDURE IF EXISTS sp_order_liststatushistory_1$$
CREATE PROCEDURE sp_order_liststatushistory_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT osh.id, osh.from_status AS fromStatus, osh.to_status AS toStatus,
            osh.changed_by AS changedBy, u.full_name AS changedByName,
            osh.note, osh.created_at AS createdAt
     FROM order_status_history osh
     LEFT JOIN users u ON u.id = osh.changed_by
     WHERE osh.order_id = p_1 ORDER BY osh.created_at, osh.id;
END$$

DROP PROCEDURE IF EXISTS sp_order_cancelorder_1$$
CREATE PROCEDURE sp_order_cancelorder_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE orders
     SET status = 'CANCELLED', cancel_reason = p_1, cancelled_at = CURRENT_TIMESTAMP
     WHERE id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_payment_findorderforupdate_1$$
CREATE PROCEDURE sp_payment_findorderforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, order_code AS orderCode, user_id AS userId,
            total_amount AS totalAmount, payment_method AS paymentMethod,
            payment_status AS paymentStatus, status AS orderStatus
     FROM orders WHERE id = p_1 LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_payment_findorder_1$$
CREATE PROCEDURE sp_payment_findorder_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, order_code AS orderCode, user_id AS userId,
            total_amount AS totalAmount, payment_method AS paymentMethod,
            payment_status AS paymentStatus, status AS orderStatus
     FROM orders WHERE id = p_1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_payment_findpaymentforupdate_1$$
CREATE PROCEDURE sp_payment_findpaymentforupdate_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, order_id AS orderId, method, status, amount,
  transaction_code AS transactionCode, gateway_response AS gatewayResponse,
  paid_at AS paidAt, refunded_at AS refundedAt,
  created_at AS createdAt, updated_at AS updatedAt FROM payments
     WHERE order_id = p_1 AND method = p_2
     ORDER BY id DESC LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_payment_createpayment_1$$
CREATE PROCEDURE sp_payment_createpayment_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO payments
       (order_id, method, status, amount, paid_at, refunded_at)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_payment_updateorderpaymentstatus_1$$
CREATE PROCEDURE sp_payment_updateorderpaymentstatus_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE orders SET payment_status = p_1 WHERE id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_payment_createpaymentnotification_1$$
CREATE PROCEDURE sp_payment_createpaymentnotification_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO notifications
       (user_id, title, message, type, reference_type, reference_id)
     VALUES (p_1, p_2, p_3, 'PAYMENT', 'order', p_4);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_findcategory_1$$
CREATE PROCEDURE sp_product_findcategory_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, name, slug FROM categories
     WHERE id = p_1 AND deleted_at IS NULL LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_product_findbrand_1$$
CREATE PROCEDURE sp_product_findbrand_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, name, slug FROM brands
     WHERE id = p_1 AND deleted_at IS NULL LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_product_softdeleteproduct_1$$
CREATE PROCEDURE sp_product_softdeleteproduct_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products SET status = 'INACTIVE', deleted_at = CURRENT_TIMESTAMP
     WHERE id = p_1 AND deleted_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_lockproduct_1$$
CREATE PROCEDURE sp_product_lockproduct_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM products WHERE id = p_1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_product_findvariant_1$$
CREATE PROCEDURE sp_product_findvariant_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, sku, variant_name AS variantName,
  attributes, price, sale_price AS salePrice, stock, sold_count AS soldCount,
  image_url AS imageUrl, sort_order AS sortOrder, status,
  created_at AS createdAt, updated_at AS updatedAt FROM product_variants WHERE id = p_1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_product_deletevariant_1$$
CREATE PROCEDURE sp_product_deletevariant_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM product_variants WHERE id = p_1 AND product_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_varianthasorderhistory_1$$
CREATE PROCEDURE sp_product_varianthasorderhistory_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT 1 AS found
     FROM order_items
     WHERE variant_id = p_1
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_product_syncproductfromvariants_1$$
CREATE PROCEDURE sp_product_syncproductfromvariants_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT COALESCE(SUM(stock), 0) AS stock FROM product_variants
     WHERE product_id = p_1;
END$$

DROP PROCEDURE IF EXISTS sp_product_syncproductfromvariants_2$$
CREATE PROCEDURE sp_product_syncproductfromvariants_2(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT price, sale_price AS salePrice FROM product_variants
     WHERE product_id = p_1 AND status = 'ACTIVE'
     ORDER BY COALESCE(sale_price, price), sort_order, id
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_product_syncproductfromvariants_3$$
CREATE PROCEDURE sp_product_syncproductfromvariants_3(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products SET stock = p_1, price = p_2, sale_price = p_3 WHERE id = p_4;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_syncproductfromvariants_4$$
CREATE PROCEDURE sp_product_syncproductfromvariants_4(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products SET stock = 0 WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_listimages_1$$
CREATE PROCEDURE sp_product_listimages_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, variant_id AS variantId,
  image_url AS imageUrl, alt_text AS altText, is_primary AS isPrimary,
  sort_order AS sortOrder, created_at AS createdAt FROM product_images
     WHERE product_id = p_1
     ORDER BY is_primary DESC, sort_order, id;
END$$

DROP PROCEDURE IF EXISTS sp_product_findimage_1$$
CREATE PROCEDURE sp_product_findimage_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, product_id AS productId, variant_id AS variantId,
  image_url AS imageUrl, alt_text AS altText, is_primary AS isPrimary,
  sort_order AS sortOrder, created_at AS createdAt FROM product_images WHERE id = p_1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_product_lockimages_1$$
CREATE PROCEDURE sp_product_lockimages_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM product_images WHERE product_id = p_1 ORDER BY id FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_product_clearprimaryimage_1$$
CREATE PROCEDURE sp_product_clearprimaryimage_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE product_images SET is_primary = 0 WHERE product_id = p_1 AND is_primary = 1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_createimage_1$$
CREATE PROCEDURE sp_product_createimage_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO product_images
       (product_id, variant_id, image_url, alt_text, is_primary, sort_order)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_setprimaryimage_1$$
CREATE PROCEDURE sp_product_setprimaryimage_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE product_images SET is_primary = 1 WHERE id = p_1 AND product_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_deleteimage_1$$
CREATE PROCEDURE sp_product_deleteimage_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM product_images WHERE id = p_1 AND product_id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_product_findfirstimageid_1$$
CREATE PROCEDURE sp_product_findfirstimageid_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM product_images
     WHERE product_id = p_1 ORDER BY sort_order, id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_promotion_listpromotions_1$$
CREATE PROCEDURE sp_promotion_listpromotions_1()
SQL SECURITY INVOKER
BEGIN
  SELECT id, code, name, description,
  discount_type AS discountType, discount_value AS discountValue,
  max_discount AS maxDiscount, min_order_value AS minOrderValue,
  usage_limit AS usageLimit, usage_limit_per_user AS usageLimitPerUser,
  used_count AS usedCount, start_date AS startDate, end_date AS endDate,
  status, created_at AS createdAt, updated_at AS updatedAt FROM promotions ORDER BY created_at DESC, id DESC;
END$$

DROP PROCEDURE IF EXISTS sp_promotion_countuserusages_1$$
CREATE PROCEDURE sp_promotion_countuserusages_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT COUNT(*) AS total FROM promotion_usages
     WHERE promotion_id = p_1 AND user_id = p_2;
END$$

DROP PROCEDURE IF EXISTS sp_promotion_deactivatepromotion_1$$
CREATE PROCEDURE sp_promotion_deactivatepromotion_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE promotions SET status = 'INACTIVE' WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_review_finddeliveredpurchase_1$$
CREATE PROCEDURE sp_review_finddeliveredpurchase_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT o.id
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = p_1 AND o.status = 'DELIVERED' AND oi.product_id = p_2
     ORDER BY o.delivered_at DESC, o.id DESC
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_review_createreview_1$$
CREATE PROCEDURE sp_review_createreview_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT, IN p_3 LONGTEXT, IN p_4 LONGTEXT, IN p_5 LONGTEXT, IN p_6 LONGTEXT, IN p_7 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO reviews
       (user_id, product_id, order_id, rating, comment, images,
        is_verified_purchase, status)
     VALUES (p_1, p_2, p_3, p_4, p_5, p_6, p_7, 'APPROVED');
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_review_deletereview_1$$
CREATE PROCEDURE sp_review_deletereview_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  DELETE FROM reviews WHERE id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_review_updatestatus_1$$
CREATE PROCEDURE sp_review_updatestatus_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE reviews SET status = p_1 WHERE id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_review_replyreview_1$$
CREATE PROCEDURE sp_review_replyreview_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE reviews SET admin_reply = p_1, replied_at = CURRENT_TIMESTAMP WHERE id = p_2;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_review_syncproductrating_1$$
CREATE PROCEDURE sp_review_syncproductrating_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE products p
     SET p.rating_avg = COALESCE((
           SELECT ROUND(AVG(r.rating), 1) FROM reviews r
           WHERE r.product_id = p.id AND r.status = 'APPROVED'
         ), 0),
         p.review_count = (
           SELECT COUNT(*) FROM reviews r
           WHERE r.product_id = p.id AND r.status = 'APPROVED'
         )
     WHERE p.id = p_1;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_user_findprofilebyid_1$$
CREATE PROCEDURE sp_user_findprofilebyid_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, full_name, email, phone, avatar_url, gender, date_of_birth,
  role, status, last_login_at, created_at, updated_at
     FROM users
     WHERE id = p_1 AND deleted_at IS NULL
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_user_findpasswordbyid_1$$
CREATE PROCEDURE sp_user_findpasswordbyid_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT password_hash FROM users
     WHERE id = p_1 AND status = 'ACTIVE' AND deleted_at IS NULL
     LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_user_phonebelongstoanotheruser_1$$
CREATE PROCEDURE sp_user_phonebelongstoanotheruser_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id FROM users WHERE phone = p_1 AND id <> p_2 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_user_updatepassword_1$$
CREATE PROCEDURE sp_user_updatepassword_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE users SET password_hash = p_1
     WHERE id = p_2 AND status = 'ACTIVE' AND deleted_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_user_updateuserstatus_1$$
CREATE PROCEDURE sp_user_updateuserstatus_1(IN p_1 LONGTEXT, IN p_2 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE users SET status = p_1 WHERE id = p_2 AND deleted_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_user_revokeusertokens_1$$
CREATE PROCEDURE sp_user_revokeusertokens_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = p_1 AND revoked_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DELIMITER ;
