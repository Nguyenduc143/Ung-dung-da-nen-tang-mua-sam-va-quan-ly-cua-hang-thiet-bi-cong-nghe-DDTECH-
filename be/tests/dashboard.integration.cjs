// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `t14-${randomUUID().replaceAll('-', '').slice(0, 10)}`;
  const userIds = [];
  const productIds = [];
  const orderIds = [];
  let categoryId;
  let server;

  try {
    async function createUser(role, suffix) {
      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [`${prefix}-${suffix}`, `${prefix}-${suffix}@example.invalid`, 'test-only-no-login', role],
      );
      userIds.push(result.insertId);
      return result.insertId;
    }

    const adminId = await createUser('ADMIN', 'admin');
    const authCustomerId = await createUser('CUSTOMER', 'auth-customer');
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const adminToken = signAccessToken({ id: adminId, role: 'ADMIN' });
    const customerToken = signAccessToken({ id: authCustomerId, role: 'CUSTOMER' });

    async function request(path, token, expected = 200) {
      const response = await fetch(base + path, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      const json = await response.json();
      assert.equal(response.status, expected, `GET ${path}: ${JSON.stringify(json)}`);
      return json.data;
    }

    await request('/admin/dashboard/summary', undefined, 401);
    await request('/admin/dashboard/summary', customerToken, 403);

    const [dateRows] = await pool.execute(
      `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today,
              DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 45 DAY), '%Y-%m-%d') AS fromDate`,
    );
    const customPath = `/admin/dashboard/revenue?from=${dateRows[0].fromDate}&to=${dateRows[0].today}`;
    const baseline = {
      summary: await request('/admin/dashboard/summary', adminToken),
      revenue7: await request('/admin/dashboard/revenue?period=7d', adminToken),
      revenue30: await request('/admin/dashboard/revenue?period=30d', adminToken),
      revenue12m: await request('/admin/dashboard/revenue?period=12m', adminToken),
      revenueCustom: await request(customPath, adminToken),
      statuses: await request('/admin/dashboard/orders-by-status', adminToken),
    };

    const extraCustomerOne = await createUser('CUSTOMER', 'customer-one');
    await createUser('CUSTOMER', 'customer-two');
    const [categoryResult] = await pool.execute(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [`${prefix}-category`, `${prefix}-category`],
    );
    categoryId = categoryResult.insertId;

    async function createProduct(suffix, stock, hasVariants = false) {
      const [result] = await pool.execute(
        `INSERT INTO products
           (category_id, name, slug, sku, price, stock, has_variants, status)
         VALUES (?, ?, ?, ?, 1000, ?, ?, 'ACTIVE')`,
        [categoryId, `${prefix}-${suffix}`, `${prefix}-${suffix}`, `${prefix}-${suffix}`, stock,
          hasVariants ? 1 : 0],
      );
      productIds.push(result.insertId);
      return result.insertId;
    }

    const firstProductId = await createProduct('top-one', 2);
    const secondProductId = await createProduct('top-two', 10);
    const variantProductId = await createProduct('variant-product', 1, true);
    await pool.execute(
      `INSERT INTO product_variants (product_id, sku, variant_name, price, stock, status)
       VALUES (?, ?, ?, 1000, 1, 'ACTIVE')`,
      [variantProductId, `${prefix}-variant`, `${prefix}-variant`],
    );

    async function createOrder(index, status, total, ageDays, productId, quantity, price) {
      const code = `T14${prefix.slice(4)}${index}`;
      const [result] = await pool.execute(
        `INSERT INTO orders
           (order_code, user_id, receiver_name, receiver_phone, shipping_address,
            subtotal, total_amount, payment_method, payment_status, status,
            delivered_at, cancelled_at, created_at)
         VALUES (?, ?, ?, '0900000000', 'Test address', ?, ?, 'COD', ?, ?,
                 IF(? = 'DELIVERED', DATE_SUB(NOW(), INTERVAL ? DAY), NULL),
                 IF(? = 'CANCELLED', NOW(), NULL), DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [code, extraCustomerOne, `${prefix}-receiver`, total, total,
          status === 'DELIVERED' ? 'PAID' : 'UNPAID', status,
          status, ageDays, status, ageDays],
      );
      orderIds.push(result.insertId);
      if (productId) {
        await pool.execute(
          `INSERT INTO order_items
             (order_id, product_id, product_name, product_sku, original_price, price, quantity)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, productId, `${prefix}-snapshot-${index}`,
            productId === firstProductId ? `${prefix}-top-one` : `${prefix}-top-two`,
            price, price, quantity],
        );
      }
    }

    await createOrder(1, 'DELIVERED', 100, 0, firstProductId, 2, 50);
    await createOrder(2, 'DELIVERED', 200, 3, secondProductId, 1, 200);
    await createOrder(3, 'DELIVERED', 300, 40, firstProductId, 3, 100);
    await createOrder(4, 'PENDING', 999, 0, null, 0, 0);
    await createOrder(5, 'CANCELLED', 999, 0, null, 0, 0);

    const summary = await request('/admin/dashboard/summary', adminToken);
    assert.equal(summary.revenueDefinition, 'DELIVERED');
    assert.equal(summary.totalRevenue, baseline.summary.totalRevenue + 600);
    assert.equal(summary.ordersCount, baseline.summary.ordersCount + 5);
    assert.equal(summary.customerCount, baseline.summary.customerCount + 2);
    assert.equal(summary.productCount, baseline.summary.productCount + 3);
    assert.equal(summary.todayRevenue, baseline.summary.todayRevenue + 100);
    assert.equal(summary.pendingOrders, baseline.summary.pendingOrders + 1);

    const revenue7 = await request('/admin/dashboard/revenue', adminToken);
    const revenue30 = await request('/admin/dashboard/revenue?period=30d', adminToken);
    const revenue12m = await request('/admin/dashboard/revenue?period=12m', adminToken);
    const revenueCustom = await request(customPath, adminToken);
    assert.equal(revenue7.period, '7d');
    assert.equal(revenue7.points.length, 7);
    assert.equal(revenue7.totalRevenue, baseline.revenue7.totalRevenue + 300);
    assert.equal(revenue30.points.length, 30);
    assert.equal(revenue30.totalRevenue, baseline.revenue30.totalRevenue + 300);
    assert.equal(revenue12m.points.length, 12);
    assert.equal(revenue12m.groupBy, 'MONTH');
    assert.equal(revenue12m.totalRevenue, baseline.revenue12m.totalRevenue + 600);
    assert.equal(revenueCustom.period, 'custom');
    assert.equal(revenueCustom.totalRevenue, baseline.revenueCustom.totalRevenue + 600);

    const statusData = await request('/admin/dashboard/orders-by-status', adminToken);
    const beforeStatuses = new Map(baseline.statuses.statuses.map((item) => [item.status, item.ordersCount]));
    const afterStatuses = new Map(statusData.statuses.map((item) => [item.status, item.ordersCount]));
    assert.equal(afterStatuses.get('DELIVERED'), beforeStatuses.get('DELIVERED') + 3);
    assert.equal(afterStatuses.get('PENDING'), beforeStatuses.get('PENDING') + 1);
    assert.equal(afterStatuses.get('CANCELLED'), beforeStatuses.get('CANCELLED') + 1);
    assert.equal(statusData.statuses.length, 6);

    const topProducts = await request('/admin/dashboard/top-products?limit=50', adminToken);
    const firstTop = topProducts.products.find((item) => item.productId === firstProductId);
    const secondTop = topProducts.products.find((item) => item.productId === secondProductId);
    assert.deepEqual(
      { quantitySold: firstTop.quantitySold, revenue: firstTop.revenue, ordersCount: firstTop.ordersCount },
      { quantitySold: 5, revenue: 400, ordersCount: 2 },
    );
    assert.deepEqual(
      { quantitySold: secondTop.quantitySold, revenue: secondTop.revenue, ordersCount: secondTop.ordersCount },
      { quantitySold: 1, revenue: 200, ordersCount: 1 },
    );

    const recent = await request('/admin/dashboard/recent-orders?limit=50', adminToken);
    assert.ok(orderIds.every((id) => recent.orders.some((order) => order.id === id)));
    const lowStock = await request('/admin/dashboard/low-stock?threshold=2', adminToken);
    assert.ok(lowStock.items.some((item) => item.product.id === firstProductId && item.variant === null));
    assert.ok(lowStock.items.some((item) => item.variant?.sku === `${prefix}-variant`));

    await request('/admin/dashboard/summary?extra=1', adminToken, 422);
    await request('/admin/dashboard/top-products?limit=51', adminToken, 422);
    await request('/admin/dashboard/revenue?from=2026-01-01', adminToken, 422);
    await request('/admin/dashboard/revenue?period=7d&from=2026-01-01&to=2026-01-02', adminToken, 422);
    await request('/admin/dashboard/revenue?from=2026-02-31&to=2026-03-01', adminToken, 422);
    await request('/admin/dashboard/revenue?from=2026-03-02&to=2026-03-01', adminToken, 422);
    await request('/admin/dashboard/revenue?from=2020-01-01&to=2022-01-01', adminToken, 422);

    console.log('PASS: admin dashboard summary, revenue, statuses, products, orders and low stock');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const orderId of orderIds) await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    for (const productId of productIds.reverse()) {
      await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    }
    for (const userId of userIds.reverse()) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    if (categoryId) await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
