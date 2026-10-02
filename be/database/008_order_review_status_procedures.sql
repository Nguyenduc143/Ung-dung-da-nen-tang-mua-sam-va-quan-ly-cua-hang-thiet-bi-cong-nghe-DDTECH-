DELIMITER $$

DROP PROCEDURE IF EXISTS sp_order_listreviewedproducts_1$$
CREATE PROCEDURE sp_order_listreviewedproducts_1(
  IN p_user_id BIGINT UNSIGNED,
  IN p_order_id BIGINT UNSIGNED
)
SQL SECURITY INVOKER
BEGIN
  SELECT DISTINCT r.product_id AS productId, r.id AS reviewId
  FROM reviews r
  INNER JOIN order_items oi ON oi.product_id = r.product_id
  WHERE r.user_id = p_user_id
    AND oi.order_id = p_order_id;
END$$

DELIMITER ;
