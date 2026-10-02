// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

process.env.VNPAY_TMN_CODE = 'TESTVNP1';
process.env.VNPAY_HASH_SECRET = 'test-vnpay-secret-for-integration-tests';
process.env.VNPAY_RETURN_URL = 'http://localhost:5000/api/payments/vnpay/return';
process.env.VNPAY_MOBILE_RETURN_URL = 'ddtech://payment-result';

const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');
const { signVnpayParams } = require('../dist/utils/vnpay');

(async () => {
  const prefix = `test09-${randomUUID().slice(0, 10)}`;
  const users = [];
  const orders = [];
  let server;

  try {
    for (const [index, role] of ['CUSTOMER', 'CUSTOMER', 'ADMIN'].entries()) {
      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [`${prefix}-${index}`, `${prefix}-${index}@example.invalid`, 'test-only-no-login', role],
      );
      users.push(result.insertId);
    }

    async function createOrder(suffix, paymentMethod, status = 'PENDING', totalAmount = 1234) {
      const [result] = await pool.execute(
        `INSERT INTO orders
           (order_code, user_id, receiver_name, receiver_phone, shipping_address,
            subtotal, shipping_fee, discount_amount, total_amount,
            payment_method, payment_status, status)
         VALUES (?, ?, ?, '0901234567', 'Địa chỉ kiểm thử',
                 ?, 0, 0, ?, ?, 'UNPAID', ?)`,
        [`${prefix.slice(0, 15)}${suffix.slice(0, 4)}`, users[0], `${prefix} receiver`, totalAmount, totalAmount, paymentMethod, status],
      );
      orders.push(result.insertId);
      return result.insertId;
    }

    const codOrderId = await createOrder('COD', 'COD', 'SHIPPING');
    const onlineOrderId = await createOrder('VNPAY', 'VNPAY', 'PENDING', 10000);
    const cancelledOrderId = await createOrder('CANCEL', 'COD', 'CANCELLED');
    const mismatchOrderId = await createOrder('MISMATCH', 'COD');
    await pool.execute(
      "INSERT INTO payments (order_id, method, status, amount) VALUES (?, 'COD', 'UNPAID', 1)",
      [mismatchOrderId],
    );

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const customerToken = signAccessToken({ id: users[0], role: 'CUSTOMER', authVersion: 0 });
    const otherCustomerToken = signAccessToken({ id: users[1], role: 'CUSTOMER', authVersion: 0 });
    const adminToken = signAccessToken({ id: users[2], role: 'ADMIN', authVersion: 0 });

    async function request(method, path, body, token, expected = 200) {
      const response = await fetch(base + path, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(json)}`);
      return json.data;
    }

    await request('POST', `/payments/${codOrderId}/create`, {}, undefined, 401);
    await request('GET', `/payments/${codOrderId}`, undefined, undefined, 401);
    await request('POST', `/payments/${codOrderId}/create`, { amount: 1 }, customerToken, 422);
    await request('POST', `/payments/${codOrderId}/create`, {}, otherCustomerToken, 404);
    await request('GET', `/payments/${codOrderId}`, undefined, customerToken, 404);

    const created = await request(
      'POST', `/payments/${codOrderId}/create`, {}, customerToken, 201,
    );
    assert.equal(created.payment.orderId, codOrderId);
    assert.equal(created.payment.method, 'COD');
    assert.equal(created.payment.status, 'UNPAID');
    assert.equal(created.payment.amount, 1234);

    const repeated = await request(
      'POST', `/payments/${codOrderId}/create`, {}, customerToken,
    );
    assert.equal(repeated.payment.id, created.payment.id);
    const [paymentCount] = await pool.execute(
      'SELECT COUNT(*) AS total FROM payments WHERE order_id = ?', [codOrderId],
    );
    assert.equal(paymentCount[0].total, 1);

    await request('GET', `/payments/${codOrderId}`, undefined, otherCustomerToken, 404);
    const adminDetail = await request(
      'GET', `/payments/${codOrderId}`, undefined, adminToken,
    );
    assert.equal(adminDetail.payment.id, created.payment.id);

    const onlineCreated = await request(
      'POST', `/payments/${onlineOrderId}/create`, {}, customerToken, 201,
    );
    assert.equal(onlineCreated.payment.method, 'VNPAY');
    assert.equal(onlineCreated.payment.status, 'UNPAID');
    assert.match(onlineCreated.paymentUrl, /^https:\/\/sandbox\.vnpayment\.vn\/paymentv2\/vpcpay\.html\?/);
    assert.ok(Date.parse(onlineCreated.expiresAt) > Date.now());

    const onlineRepeated = await request(
      'POST', `/payments/${onlineOrderId}/create`, {}, customerToken, 200,
    );
    assert.equal(onlineRepeated.payment.id, onlineCreated.payment.id);
    assert.equal(onlineRepeated.paymentUrl, onlineCreated.paymentUrl);

    const transactionRef = onlineCreated.payment.transactionCode;
    assert.match(transactionRef, new RegExp(`^D${onlineOrderId}T\\d+$`));

    const ipnParams = {
      vnp_Amount: '1000000',
      vnp_BankCode: 'NCB',
      vnp_OrderInfo: `Thanh toan don hang ${onlineOrderId}`,
      vnp_PayDate: '20261002193353',
      vnp_ResponseCode: '00',
      vnp_TmnCode: 'TESTVNP1',
      vnp_TransactionNo: '15000001',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: transactionRef,
    };
    const toQuery = (params) => new URLSearchParams(params).toString();
    const invalidResponse = await fetch(
      `${base}/payments/vnpay/ipn?${toQuery({ ...ipnParams, vnp_SecureHash: '0'.repeat(128) })}`,
    );
    assert.deepEqual(await invalidResponse.json(), { RspCode: '97', Message: 'Invalid signature' });

    const wrongAmountParams = { ...ipnParams, vnp_Amount: '999900' };
    wrongAmountParams.vnp_SecureHash = signVnpayParams(wrongAmountParams, process.env.VNPAY_HASH_SECRET);
    const wrongAmountResponse = await fetch(
      `${base}/payments/vnpay/ipn?${toQuery(wrongAmountParams)}`,
    );
    assert.deepEqual(await wrongAmountResponse.json(), { RspCode: '04', Message: 'Invalid amount' });

    const successParams = { ...ipnParams };
    successParams.vnp_SecureHash = signVnpayParams(successParams, process.env.VNPAY_HASH_SECRET);
    const returnResponse = await fetch(
      `${base}/payments/vnpay/return?${toQuery(successParams)}`,
      { redirect: 'manual' },
    );
    assert.equal(returnResponse.status, 302);
    assert.match(
      returnResponse.headers.get('location'),
      new RegExp(`^ddtech://payment-result\\?status=success&transactionRef=.*&orderId=${onlineOrderId}`),
    );
    const successResponse = await fetch(`${base}/payments/vnpay/ipn?${toQuery(successParams)}`);
    assert.deepEqual(await successResponse.json(), { RspCode: '00', Message: 'Confirm Success' });
    const duplicateResponse = await fetch(`${base}/payments/vnpay/ipn?${toQuery(successParams)}`);
    assert.deepEqual(await duplicateResponse.json(), { RspCode: '02', Message: 'Order already confirmed' });

    const onlinePaid = await request(
      'GET', `/payments/${onlineOrderId}`, undefined, customerToken,
    );
    assert.equal(onlinePaid.order.paymentStatus, 'PAID');
    assert.equal(onlinePaid.payment.status, 'PAID');
    assert.ok(onlinePaid.payment.paidAt);
    await request(
      'POST', `/payments/${cancelledOrderId}/create`, {}, customerToken, 409,
    );
    await request('POST', '/payments/vnpay/callback', {}, customerToken, 404);
    await request(
      'POST', `/payments/${mismatchOrderId}/create`, {}, customerToken, 409,
    );

    const delivered = await request(
      'PATCH',
      `/admin/orders/${codOrderId}/status`,
      { status: 'DELIVERED', note: 'Đã nhận tiền COD' },
      adminToken,
    );
    assert.equal(delivered.order.status, 'DELIVERED');
    assert.equal(delivered.order.paymentStatus, 'PAID');

    const paidDetail = await request(
      'GET', `/payments/${codOrderId}`, undefined, customerToken,
    );
    assert.equal(paidDetail.order.paymentStatus, 'PAID');
    assert.equal(paidDetail.payment.status, 'PAID');
    assert.ok(paidDetail.payment.paidAt);

    const [synchronizedRows] = await pool.execute(
      `SELECT o.payment_status AS orderStatus, p.status AS paymentStatus,
              p.paid_at AS paidAt
       FROM orders o JOIN payments p ON p.order_id = o.id
       WHERE o.id = ?`,
      [codOrderId],
    );
    assert.equal(synchronizedRows[0].orderStatus, 'PAID');
    assert.equal(synchronizedRows[0].paymentStatus, 'PAID');
    assert.ok(synchronizedRows[0].paidAt);

    const [notificationRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications
       WHERE user_id = ? AND type = 'PAYMENT'
         AND reference_type = 'order' AND reference_id = ?`,
      [users[0], codOrderId],
    );
    assert.equal(notificationRows[0].total, 1);

    const [mismatchRows] = await pool.execute(
      `SELECT o.payment_status AS orderStatus, p.status AS paymentStatus
       FROM orders o JOIN payments p ON p.order_id = o.id
       WHERE o.id = ?`,
      [mismatchOrderId],
    );
    assert.equal(mismatchRows[0].orderStatus, 'UNPAID');
    assert.equal(mismatchRows[0].paymentStatus, 'UNPAID');

    console.log('PASS: COD synchronization and signed VNPAY create/IPN flow');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (orders.length > 0) {
      const placeholders = orders.map(() => '?').join(', ');
      await pool.execute(
        `DELETE FROM notifications WHERE reference_type = 'order'
         AND reference_id IN (${placeholders})`,
        orders,
      );
      await pool.execute(`DELETE FROM orders WHERE id IN (${placeholders})`, orders);
    }
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
