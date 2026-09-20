// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test11-${randomUUID().slice(0, 10)}`;
  const users = [];
  let categoryId;
  let productId;
  let orderId;
  let verifiedReviewId;
  let unverifiedReviewId;
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
         (category_id, name, slug, sku, price, stock, has_variants, status)
       VALUES (?, ?, ?, ?, 1000, 10, 0, 'ACTIVE')`,
      [categoryId, `${prefix} product`, `${prefix}-product`, `${prefix}-sku`],
    );
    productId = productResult.insertId;

    const [orderResult] = await pool.execute(
      `INSERT INTO orders
         (order_code, user_id, receiver_name, receiver_phone, shipping_address,
          subtotal, total_amount, status, delivered_at)
       VALUES (?, ?, 'Test', '0901234567', 'Địa chỉ test', 1000, 1000,
               'DELIVERED', CURRENT_TIMESTAMP)`,
      [`T11${randomUUID().replaceAll('-', '').slice(0, 12)}`, users[0]],
    );
    orderId = orderResult.insertId;
    await pool.execute(
      `INSERT INTO order_items
         (order_id, product_id, product_name, product_sku,
          original_price, price, quantity)
       VALUES (?, ?, ?, ?, 1000, 1000, 1)`,
      [orderId, productId, `${prefix} product`, `${prefix}-sku`],
    );

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

    const empty = await request('GET', `/products/${productId}/reviews`);
    assert.equal(empty.pagination.total, 0);
    await request('GET', '/products/999999999/reviews', undefined, undefined, 404);
    await request('POST', `/products/${productId}/reviews`, {
      rating: 5,
    }, undefined, 401);
    await request('POST', `/products/${productId}/reviews`, {
      rating: 6,
    }, customerToken, 422);
    await request('POST', `/products/${productId}/reviews`, {
      rating: 5,
      userId: users[1],
    }, customerToken, 422);

    const verified = await request('POST', `/products/${productId}/reviews`, {
      rating: 5,
      comment: 'Sản phẩm tốt',
      images: ['https://example.com/review-1.jpg'],
    }, customerToken, 201);
    verifiedReviewId = verified.id;
    assert.equal(verified.user.id, users[0]);
    assert.equal(verified.orderId, orderId);
    assert.equal(verified.isVerifiedPurchase, true);
    assert.deepEqual(verified.images, ['https://example.com/review-1.jpg']);
    assert.equal(verified.status, 'APPROVED');
    await request('POST', `/products/${productId}/reviews`, {
      rating: 4,
    }, customerToken, 409);

    const unverified = await request('POST', `/products/${productId}/reviews`, {
      rating: 3,
      comment: 'Chưa mua tại cửa hàng',
    }, otherCustomerToken, 201);
    unverifiedReviewId = unverified.id;
    assert.equal(unverified.orderId, null);
    assert.equal(unverified.isVerifiedPurchase, false);

    let [productRows] = await pool.execute(
      'SELECT rating_avg AS ratingAvg, review_count AS reviewCount FROM products WHERE id = ?',
      [productId],
    );
    assert.equal(Number(productRows[0].ratingAvg), 4);
    assert.equal(productRows[0].reviewCount, 2);

    const publicReviews = await request(
      'GET', `/products/${productId}/reviews?page=1&limit=1&rating=5`,
    );
    assert.equal(publicReviews.reviews.length, 1);
    assert.equal(publicReviews.pagination.total, 1);
    await request('PATCH', `/reviews/${verifiedReviewId}`, {
      rating: 1,
    }, otherCustomerToken, 404);
    await request('DELETE', `/reviews/${verifiedReviewId}`, undefined, otherCustomerToken, 404);

    const updated = await request('PATCH', `/reviews/${verifiedReviewId}`, {
      rating: 4,
      comment: 'Cập nhật đánh giá',
      images: null,
    }, customerToken);
    assert.equal(updated.rating, 4);
    assert.equal(updated.images, null);
    [productRows] = await pool.execute(
      'SELECT rating_avg AS ratingAvg, review_count AS reviewCount FROM products WHERE id = ?',
      [productId],
    );
    assert.equal(Number(productRows[0].ratingAvg), 3.5);
    assert.equal(productRows[0].reviewCount, 2);

    await request('GET', '/admin/reviews', undefined, undefined, 401);
    await request('GET', '/admin/reviews', undefined, customerToken, 403);
    const adminReviews = await request(
      'GET', `/admin/reviews?productId=${productId}&status=APPROVED`,
      undefined,
      adminToken,
    );
    assert.equal(adminReviews.pagination.total, 2);

    const hidden = await request(
      'PATCH',
      `/admin/reviews/${unverifiedReviewId}/status`,
      { status: 'HIDDEN' },
      adminToken,
    );
    assert.equal(hidden.status, 'HIDDEN');
    [productRows] = await pool.execute(
      'SELECT rating_avg AS ratingAvg, review_count AS reviewCount FROM products WHERE id = ?',
      [productId],
    );
    assert.equal(Number(productRows[0].ratingAvg), 4);
    assert.equal(productRows[0].reviewCount, 1);
    const visibleReviews = await request('GET', `/products/${productId}/reviews`);
    assert.equal(visibleReviews.pagination.total, 1);

    const replied = await request(
      'POST',
      `/admin/reviews/${verifiedReviewId}/reply`,
      { reply: 'Cảm ơn bạn đã đánh giá sản phẩm.' },
      adminToken,
    );
    assert.equal(replied.adminReply, 'Cảm ơn bạn đã đánh giá sản phẩm.');
    assert.ok(replied.repliedAt);

    await request(
      'PATCH',
      `/admin/reviews/${verifiedReviewId}/status`,
      { status: 'PENDING' },
      adminToken,
    );
    [productRows] = await pool.execute(
      'SELECT rating_avg AS ratingAvg, review_count AS reviewCount FROM products WHERE id = ?',
      [productId],
    );
    assert.equal(Number(productRows[0].ratingAvg), 0);
    assert.equal(productRows[0].reviewCount, 0);
    await request(
      'PATCH',
      `/admin/reviews/${verifiedReviewId}/status`,
      { status: 'APPROVED' },
      adminToken,
    );

    await request('DELETE', `/reviews/${verifiedReviewId}`, undefined, customerToken);
    verifiedReviewId = undefined;
    [productRows] = await pool.execute(
      'SELECT rating_avg AS ratingAvg, review_count AS reviewCount FROM products WHERE id = ?',
      [productId],
    );
    assert.equal(Number(productRows[0].ratingAvg), 0);
    assert.equal(productRows[0].reviewCount, 0);

    console.log('PASS: review ownership, verified purchase, moderation, reply and rating synchronization');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (verifiedReviewId) await pool.execute('DELETE FROM reviews WHERE id = ?', [verifiedReviewId]);
    if (unverifiedReviewId) await pool.execute('DELETE FROM reviews WHERE id = ?', [unverifiedReviewId]);
    if (orderId) await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    if (productId) await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    if (categoryId) await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
