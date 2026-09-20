// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test10-${randomUUID().slice(0, 10)}`;
  const users = [];
  const promotions = [];
  let categoryId;
  let productId;
  let usageOrderId;
  let server;

  try {
    for (const [index, role] of ['CUSTOMER', 'CUSTOMER', 'ADMIN'].entries()) {
      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [`${prefix}-${index}`, `${prefix}-${index}@example.invalid`, 'test-only-no-login', role],
      );
      users.push(result.insertId);
    }
    const [categoryResult] = await pool.execute(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [prefix, `${prefix}-category`],
    );
    categoryId = categoryResult.insertId;
    const [productResult] = await pool.execute(
      `INSERT INTO products
         (category_id, name, slug, sku, price, sale_price, stock, has_variants, status)
       VALUES (?, ?, ?, ?, 1000, 800, 10, 0, 'ACTIVE')`,
      [categoryId, `${prefix} product`, `${prefix}-product`, `${prefix}-sku`],
    );
    productId = productResult.insertId;
    for (const userId of users.slice(0, 2)) {
      const [cartResult] = await pool.execute('INSERT INTO carts (user_id) VALUES (?)', [userId]);
      await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 2)',
        [cartResult.insertId, productId],
      );
    }

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const customerToken = signAccessToken({ id: users[0], role: 'CUSTOMER' });
    const otherCustomerToken = signAccessToken({ id: users[1], role: 'CUSTOMER' });
    const adminToken = signAccessToken({ id: users[2], role: 'ADMIN' });

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

    const now = Date.now();
    const activeDates = {
      startDate: new Date(now - 86400000).toISOString(),
      endDate: new Date(now + 86400000).toISOString(),
    };

    await request('GET', '/admin/promotions', undefined, undefined, 401);
    await request('POST', '/admin/promotions', {}, customerToken, 403);
    await request('POST', '/admin/promotions', {
      code: `${prefix}-invalid`,
      name: 'Invalid percent',
      discountType: 'PERCENT',
      discountValue: 101,
      ...activeDates,
    }, adminToken, 422);

    const percent = await request('POST', '/admin/promotions', {
      code: `${prefix}-percent`,
      name: 'Giảm phần trăm',
      description: 'Promotion kiểm thử',
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscount: 100,
      minOrderValue: 1000,
      usageLimit: 10,
      usageLimitPerUser: 1,
      ...activeDates,
      status: 'ACTIVE',
    }, adminToken, 201);
    promotions.push(percent.id);
    assert.equal(percent.code, `${prefix}-percent`.toUpperCase());
    assert.equal(percent.usedCount, 0);

    await request('POST', '/admin/promotions', {
      code: `${prefix}-percent`,
      name: 'Trùng mã',
      discountType: 'FIXED',
      discountValue: 100,
      ...activeDates,
    }, adminToken, 409);
    const list = await request('GET', '/admin/promotions', undefined, adminToken);
    assert.ok(list.promotions.some((promotion) => promotion.id === percent.id));

    await request('POST', '/promotions/validate', {
      code: percent.code,
    }, undefined, 401);
    await request('POST', '/promotions/validate', {
      code: percent.code,
      subtotal: 1,
    }, customerToken, 422);
    const validated = await request('POST', '/promotions/validate', {
      code: percent.code.toLowerCase(),
    }, customerToken);
    assert.equal(validated.subtotal, 1600);
    assert.equal(validated.discountAmount, 100);
    assert.equal(validated.totalAfterDiscount, 1500);

    const fixed = await request('POST', '/admin/promotions', {
      code: `${prefix}-fixed`,
      name: 'Giảm cố định',
      discountType: 'FIXED',
      discountValue: 5000,
      minOrderValue: 0,
      usageLimitPerUser: 2,
      ...activeDates,
    }, adminToken, 201);
    promotions.push(fixed.id);
    const fixedValidated = await request('POST', '/promotions/validate', {
      code: fixed.code,
    }, customerToken);
    assert.equal(fixedValidated.discountAmount, 1600);
    assert.equal(fixedValidated.totalAfterDiscount, 0);

    const minimumOrder = await request('POST', '/admin/promotions', {
      code: `${prefix}-minimum`,
      name: 'Chưa đủ giá trị tối thiểu',
      discountType: 'FIXED',
      discountValue: 100,
      minOrderValue: 2000,
      ...activeDates,
    }, adminToken, 201);
    promotions.push(minimumOrder.id);
    await request('POST', '/promotions/validate', {
      code: minimumOrder.code,
    }, customerToken, 409);

    const future = await request('POST', '/admin/promotions', {
      code: `${prefix}-future`,
      name: 'Chưa tới ngày áp dụng',
      discountType: 'FIXED',
      discountValue: 100,
      startDate: new Date(now + 86400000).toISOString(),
      endDate: new Date(now + 172800000).toISOString(),
    }, adminToken, 201);
    promotions.push(future.id);
    await request('POST', '/promotions/validate', {
      code: future.code,
    }, customerToken, 409);

    const expired = await request('POST', '/admin/promotions', {
      code: `${prefix}-expired`,
      name: 'Đã hết hạn',
      discountType: 'FIXED',
      discountValue: 100,
      startDate: new Date(now - 259200000).toISOString(),
      endDate: new Date(now - 172800000).toISOString(),
    }, adminToken, 201);
    promotions.push(expired.id);
    await request('POST', '/promotions/validate', {
      code: expired.code,
    }, customerToken, 409);

    const [orderResult] = await pool.execute(
      `INSERT INTO orders
         (order_code, user_id, receiver_name, receiver_phone, shipping_address,
          promotion_id, promotion_code, subtotal, discount_amount, total_amount)
       VALUES (?, ?, 'Test', '0901234567', 'Địa chỉ test', ?, ?, 1600, 100, 1500)`,
      [`T10${randomUUID().replaceAll('-', '').slice(0, 12)}`, users[0], percent.id, percent.code],
    );
    usageOrderId = orderResult.insertId;
    await pool.execute(
      `INSERT INTO promotion_usages
         (promotion_id, user_id, order_id, discount_amount)
       VALUES (?, ?, ?, 100)`,
      [percent.id, users[0], usageOrderId],
    );
    await pool.execute('UPDATE promotions SET used_count = 1 WHERE id = ?', [percent.id]);

    await request('POST', '/promotions/validate', {
      code: percent.code,
    }, customerToken, 409);
    const otherValidated = await request('POST', '/promotions/validate', {
      code: percent.code,
    }, otherCustomerToken);
    assert.equal(otherValidated.discountAmount, 100);

    const limited = await request('PATCH', `/admin/promotions/${percent.id}`, {
      usageLimit: 1,
      name: 'Đã đạt giới hạn',
    }, adminToken);
    assert.equal(limited.usageLimit, 1);
    await request('POST', '/promotions/validate', {
      code: percent.code,
    }, otherCustomerToken, 409);
    await request('PATCH', `/admin/promotions/${percent.id}`, {
      usageLimit: 2,
      endDate: new Date(now - 172800000).toISOString(),
    }, adminToken, 422);
    await request('PATCH', '/admin/promotions/999999999', {
      name: 'Không tồn tại',
    }, adminToken, 404);

    await request('DELETE', `/admin/promotions/${percent.id}`, undefined, adminToken);
    const [deactivatedRows] = await pool.execute(
      'SELECT status FROM promotions WHERE id = ?', [percent.id],
    );
    assert.equal(deactivatedRows[0].status, 'INACTIVE');
    await request('POST', '/promotions/validate', {
      code: percent.code,
    }, otherCustomerToken, 409);

    console.log('PASS: promotion dates, minimum order, percent cap and usage constraints');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (usageOrderId) await pool.execute('DELETE FROM orders WHERE id = ?', [usageOrderId]);
    for (const promotionId of promotions) {
      await pool.execute('DELETE FROM promotions WHERE id = ?', [promotionId]);
    }
    if (productId) await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    if (categoryId) await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
