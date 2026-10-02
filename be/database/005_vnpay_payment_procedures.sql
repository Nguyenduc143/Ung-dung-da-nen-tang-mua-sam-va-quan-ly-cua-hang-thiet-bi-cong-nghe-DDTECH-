DROP PROCEDURE IF EXISTS sp_payment_createvnpay_1$$
CREATE PROCEDURE sp_payment_createvnpay_1(
  IN p_order_id BIGINT UNSIGNED,
  IN p_amount DECIMAL(15,2),
  IN p_transaction_code VARCHAR(100),
  IN p_gateway_response JSON
)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO payments
    (order_id, method, status, amount, transaction_code, gateway_response)
  VALUES
    (p_order_id, 'VNPAY', 'UNPAID', p_amount, p_transaction_code, p_gateway_response);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_payment_findbytransactionforupdate_1$$
CREATE PROCEDURE sp_payment_findbytransactionforupdate_1(IN p_transaction_code VARCHAR(100))
SQL SECURITY INVOKER
BEGIN
  SELECT p.id, p.order_id AS orderId, p.method, p.status, p.amount,
         p.transaction_code AS transactionCode, p.gateway_response AS gatewayResponse,
         p.paid_at AS paidAt, p.refunded_at AS refundedAt,
         p.created_at AS createdAt, p.updated_at AS updatedAt,
         o.order_code AS orderCode, o.user_id AS userId,
         o.total_amount AS orderTotalAmount, o.payment_status AS orderPaymentStatus,
         o.status AS orderStatus
  FROM payments p
  JOIN orders o ON o.id = p.order_id
  WHERE p.transaction_code = p_transaction_code AND p.method = 'VNPAY'
  LIMIT 1
  FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_payment_updatevnpayresult_1$$
CREATE PROCEDURE sp_payment_updatevnpayresult_1(
  IN p_payment_id BIGINT UNSIGNED,
  IN p_status VARCHAR(20),
  IN p_gateway_response JSON
)
SQL SECURITY INVOKER
BEGIN
  UPDATE payments
  SET status = p_status,
      gateway_response = p_gateway_response,
      paid_at = CASE
        WHEN p_status = 'PAID' THEN COALESCE(paid_at, CURRENT_TIMESTAMP)
        ELSE paid_at
      END
  WHERE id = p_payment_id;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$
