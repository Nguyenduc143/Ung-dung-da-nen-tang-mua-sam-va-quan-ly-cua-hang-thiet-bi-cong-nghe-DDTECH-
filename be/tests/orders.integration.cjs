// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test08-${randomUUID().slice(0, 10)}`;
  const users = [];
  const products = [];
  const variants = [];
  const orders = [];
  let categoryId;
  let shippingMethodId;
  let promotionId;
  let firstAddressId;
  let secondAddressId;
  let cartId;
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
    const [shippingResult] = await pool.execute(
      `INSERT INTO shipping_methods
         (code, name, base_fee, free_threshold, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [`${prefix}-SHIP`, `${prefix} shipping`, 30, 500],
    );
    shippingMethodId = shippingResult.insertId;
    const [promotionResult] = await pool.execute(
      `INSERT INTO promotions
         (code, name, discount_type, discount_value, max_discount, min_order_value,
          usage_limit, usage_limit_per_user, used_count, start_date, end_date, status)
       VALUES (?, ?, 'PERCENT', 10, 50, 100, 10, 1, 0,
               '2020-01-01 00:00:00', '2099-12-31 23:59:59', 'ACTIVE')`,
      [`${prefix}-PROMO`, `${prefix} promotion`],
    );
    promotionId = promotionResult.insertId;

    async function createProduct(suffix, data) {
      const [result] = await pool.execute(
        `INSERT INTO products
           (category_id, name, slug, sku, price, sale_price, stock,
            sold_count, has_variants, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'ACTIVE')`,
        [
          categoryId,
          `${prefix}-${suffix}`,
          `${prefix}-${suffix}`,
          `${prefix}-${suffix}`,
          data.price,
          data.salePrice ?? null,
          data.stock,
          data.hasVariants ? 1 : 0,
        ],
      );
      products.push(result.insertId);
      return result.insertId;
    }

    const plainProductId = await createProduct('plain', {
      price: 200, salePrice: 150, stock: 5,
    });
    const variantProductId = await createProduct('variant', {
      price: 200, salePrice: 180, stock: 4, hasVariants: true,
    });
    const otherProductId = await createProduct('other', {
      price: 300, stock: 2, hasVariants: true,
    });
    const [variantResult] = await pool.execute(
      `INSERT INTO product_variants
         (product_id, sku, variant_name, price, sale_price, stock, sold_count, status)
       VALUES (?, ?, '256GB - Black', 200, 180, 4, 0, 'ACTIVE')`,
      [variantProductId, `${prefix}-variant`],
    );
    variants.push(variantResult.insertId);
    const variantId = variantResult.insertId;
    const [otherVariantResult] = await pool.execute(
      `INSERT INTO product_variants
         (product_id, sku, variant_name, price, stock, status)
       VALUES (?, ?, 'Other', 300, 2, 'ACTIVE')`,
      [otherProductId, `${prefix}-other-variant`],
    );
    variants.push(otherVariantResult.insertId);
    await pool.execute(
      'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)',
      [plainProductId, 'https://example.com/order-product.png'],
    );

    const [firstAddressResult] = await pool.execute(
      `INSERT INTO addresses
         (user_id, receiver_name, receiver_phone, province, district, ward, address_line)
       VALUES (?, ?, '0901234567', 'Hà Nội', 'Đống Đa', 'Láng Hạ', '12 Test')`,
      [users[0], `${prefix} receiver`],
    );
    firstAddressId = firstAddressResult.insertId;
    const [secondAddressResult] = await pool.execute(
      `INSERT INTO addresses
         (user_id, receiver_name, receiver_phone, province, district, ward, address_line)
       VALUES (?, ?, '0912345678', 'Hà Nội', 'Cầu Giấy', NULL, '34 Test')`,
      [users[1], `${prefix} other`],
    );
    secondAddressId = secondAddressResult.insertId;
    const [cartResult] = await pool.execute('INSERT INTO carts (user_id) VALUES (?)', [users[0]]);
    cartId = cartResult.insertId;
    await pool.execute(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
       VALUES (?, ?, NULL, 2), (?, ?, ?, 1)`,
      [cartId, plainProductId, cartId, variantProductId, variantId],
    );

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const customerToken = signAccessToken({ id: users[0], role: 'CUSTOMER' });
    const otherCustomerToken = signAccessToken({ id: users[1], role: 'CUSTOMER' });
    const adminToken = signAccessToken({ id: users[2], role: 'ADMIN' });

    async function rawRequest(method, path, body, token) {
      const response = await fetch(base + path, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = await response.json();
      return { status: response.status, json };
    }

    async function request(method, path, body, token, expected = 200) {
      const result = await rawRequest(method, path, body, token);
      assert.equal(result.status, expected, `${method} ${path}: ${JSON.stringify(result.json)}`);
      return result.json.data;
    }

    await request('POST', '/orders', {}, undefined, 401);
    await request('GET', '/admin/orders', undefined, undefined, 401);
    await request('GET', '/admin/orders', undefined, customerToken, 403);
    await request('POST', '/orders', {
      addressId: secondAddressId,
      shippingMethodId,
    }, customerToken, 404);
    await request('POST', '/orders', {
      addressId: firstAddressId,
      shippingMethodId: 9007199254740991,
    }, customerToken, 404);

    const firstOrderData = await request('POST', '/orders', {
      addressId: firstAddressId,
      shippingMethodId,
      promotionCode: `${prefix}-promo`.toLowerCase(),
      paymentMethod: 'COD',
      note: 'Giao giờ hành chính',
    }, customerToken, 201);
    const firstOrder = firstOrderData.order;
    orders.push(firstOrder.id);
    assert.match(firstOrder.orderCode, /^DD[A-Z0-9]+$/);
    assert.equal(firstOrder.subtotal, 480);
    assert.equal(firstOrder.shippingFee, 30);
    assert.equal(firstOrder.discountAmount, 48);
    assert.equal(firstOrder.totalAmount, 462);
    assert.equal(firstOrder.status, 'PENDING');
    assert.equal(firstOrderData.items.length, 2);
    assert.equal(firstOrderData.items.find((item) => item.variantId === variantId).productSku, `${prefix}-variant`);
    assert.equal(firstOrderData.items.find((item) => item.productId === plainProductId).productImage, 'https://example.com/order-product.png');
    assert.equal(firstOrderData.statusHistory.length, 1);

    const [cartRows] = await pool.execute('SELECT COUNT(*) AS total FROM cart_items WHERE cart_id = ?', [cartId]);
    assert.equal(cartRows[0].total, 0);
    const [plainRows] = await pool.execute('SELECT stock, sold_count FROM products WHERE id = ?', [plainProductId]);
    assert.deepEqual({ stock: plainRows[0].stock, sold: plainRows[0].sold_count }, { stock: 3, sold: 2 });
    const [variantRows] = await pool.execute('SELECT stock, sold_count FROM product_variants WHERE id = ?', [variantId]);
    assert.deepEqual({ stock: variantRows[0].stock, sold: variantRows[0].sold_count }, { stock: 3, sold: 1 });
    const [variantProductRows] = await pool.execute('SELECT stock, sold_count FROM products WHERE id = ?', [variantProductId]);
    assert.deepEqual({ stock: variantProductRows[0].stock, sold: variantProductRows[0].sold_count }, { stock: 3, sold: 1 });
    const [saleLogs] = await pool.execute(
      "SELECT COUNT(*) AS total FROM inventory_transactions WHERE reference_type = 'order' AND reference_id = ? AND type = 'SALE'",
      [firstOrder.id],
    );
    assert.equal(saleLogs[0].total, 2);
    const [usageRows] = await pool.execute('SELECT COUNT(*) AS total FROM promotion_usages WHERE order_id = ?', [firstOrder.id]);
    assert.equal(usageRows[0].total, 1);
    const [promotionRows] = await pool.execute('SELECT used_count FROM promotions WHERE id = ?', [promotionId]);
    assert.equal(promotionRows[0].used_count, 1);
    await request('DELETE', `/admin/variants/${variantId}`, undefined, adminToken, 409);

    await request('GET', `/orders/${firstOrder.id}`, undefined, otherCustomerToken, 404);
    await request('PATCH', `/orders/${firstOrder.id}/cancel`, { reason: 'Không phải đơn của tôi' }, otherCustomerToken, 404);
    const customerOrders = await request('GET', '/orders/my-orders?status=PENDING&page=1&limit=10', undefined, customerToken);
    assert.ok(customerOrders.orders.some((order) => order.id === firstOrder.id));
    const adminOrders = await request('GET', `/admin/orders?search=${firstOrder.orderCode}`, undefined, adminToken);
    assert.ok(adminOrders.orders.some((order) => order.id === firstOrder.id));
    await request('GET', `/admin/orders/${firstOrder.id}`, undefined, adminToken);

    const cancelledData = await request(
      'PATCH',
      `/orders/${firstOrder.id}/cancel`,
      { reason: 'Khách thay đổi nhu cầu' },
      customerToken,
    );
    assert.equal(cancelledData.order.status, 'CANCELLED');
    assert.equal(cancelledData.order.cancelReason, 'Khách thay đổi nhu cầu');
    assert.equal(cancelledData.statusHistory.length, 2);
    await request('PATCH', `/orders/${firstOrder.id}/cancel`, { reason: 'Hủy lần nữa' }, customerToken, 409);
    const [restoredPlainRows] = await pool.execute('SELECT stock, sold_count FROM products WHERE id = ?', [plainProductId]);
    assert.deepEqual(
      { stock: restoredPlainRows[0].stock, sold: restoredPlainRows[0].sold_count },
      { stock: 5, sold: 0 },
    );
    const [restoredVariantRows] = await pool.execute('SELECT stock, sold_count FROM product_variants WHERE id = ?', [variantId]);
    assert.deepEqual(
      { stock: restoredVariantRows[0].stock, sold: restoredVariantRows[0].sold_count },
      { stock: 4, sold: 0 },
    );
    const [cancelLogs] = await pool.execute(
      "SELECT COUNT(*) AS total FROM inventory_transactions WHERE reference_type = 'order' AND reference_id = ? AND type = 'CANCEL_ORDER'",
      [firstOrder.id],
    );
    assert.equal(cancelLogs[0].total, 2);
    const [releasedUsageRows] = await pool.execute('SELECT COUNT(*) AS total FROM promotion_usages WHERE order_id = ?', [firstOrder.id]);
    assert.equal(releasedUsageRows[0].total, 0);
    const [releasedPromotionRows] = await pool.execute('SELECT used_count FROM promotions WHERE id = ?', [promotionId]);
    assert.equal(releasedPromotionRows[0].used_count, 0);

    await pool.execute('UPDATE products SET stock = 1, sold_count = 0 WHERE id = ?', [plainProductId]);
    const [otherCartResult] = await pool.execute('INSERT INTO carts (user_id) VALUES (?)', [users[1]]);
    const otherCartId = otherCartResult.insertId;
    await pool.execute(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
       VALUES (?, ?, NULL, 1), (?, ?, NULL, 1)`,
      [cartId, plainProductId, otherCartId, plainProductId],
    );
    const concurrentCheckout = await Promise.all([
      rawRequest('POST', '/orders', {
        addressId: firstAddressId, shippingMethodId,
      }, customerToken),
      rawRequest('POST', '/orders', {
        addressId: secondAddressId, shippingMethodId,
      }, otherCustomerToken),
    ]);
    assert.deepEqual(concurrentCheckout.map((item) => item.status).sort(), [201, 409]);
    const winnerIndex = concurrentCheckout.findIndex((item) => item.status === 201);
    const concurrentOrder = concurrentCheckout[winnerIndex].json.data.order;
    orders.push(concurrentOrder.id);
    const [concurrentStock] = await pool.execute(
      'SELECT stock FROM products WHERE id = ?', [plainProductId],
    );
    assert.equal(concurrentStock[0].stock, 0);
    await request(
      'PATCH',
      `/orders/${concurrentOrder.id}/cancel`,
      { reason: 'Dọn đơn kiểm thử đồng thời' },
      winnerIndex === 0 ? customerToken : otherCustomerToken,
    );
    await pool.execute('DELETE FROM cart_items WHERE cart_id IN (?, ?)', [cartId, otherCartId]);
    await pool.execute('UPDATE products SET stock = 5, sold_count = 0 WHERE id = ?', [plainProductId]);

    await pool.execute(
      'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, NULL, 6)',
      [cartId, plainProductId],
    );
    await request('POST', '/orders', {
      addressId: firstAddressId, shippingMethodId,
    }, customerToken, 409);
    const [rollbackStockRows] = await pool.execute('SELECT stock FROM products WHERE id = ?', [plainProductId]);
    assert.equal(rollbackStockRows[0].stock, 5);
    await pool.execute('UPDATE cart_items SET quantity = 1 WHERE cart_id = ?', [cartId]);

    const secondOrderData = await request('POST', '/orders', {
      receiverName: 'Nguyễn Văn Test',
      receiverPhone: '0901234567',
      province: 'Hà Nội',
      district: 'Đống Đa',
      ward: 'Láng Hạ',
      addressLine: '99 Test',
      shippingMethodId,
      paymentMethod: 'COD',
    }, customerToken, 201);
    const secondOrder = secondOrderData.order;
    orders.push(secondOrder.id);
    assert.equal(secondOrder.shippingAddress, '99 Test, Láng Hạ, Đống Đa, Hà Nội');
    await request('PATCH', `/admin/orders/${secondOrder.id}/status`, {
      status: 'PROCESSING',
    }, adminToken, 409);
    await request('PATCH', `/admin/orders/${secondOrder.id}/status`, {
      status: 'CONFIRMED', note: 'Admin xác nhận',
    }, adminToken);
    await request('PATCH', `/admin/orders/${secondOrder.id}/status`, {
      status: 'PROCESSING', note: 'Đang đóng gói',
    }, adminToken);
    await request('PATCH', `/admin/orders/${secondOrder.id}/status`, {
      status: 'SHIPPING', note: 'Đang giao hàng',
    }, adminToken);
    await request('PATCH', `/orders/${secondOrder.id}/cancel`, {
      reason: 'Hủy khi đang giao' }, customerToken, 409);
    const deliveredData = await request('PATCH', `/admin/orders/${secondOrder.id}/status`, {
      status: 'DELIVERED', note: 'Giao thành công',
    }, adminToken);
    assert.equal(deliveredData.order.status, 'DELIVERED');
    assert.ok(deliveredData.order.confirmedAt);
    assert.ok(deliveredData.order.deliveredAt);
    assert.equal(deliveredData.statusHistory.length, 5);
    await request('PATCH', `/admin/orders/${secondOrder.id}/status`, {
      status: 'CONFIRMED',
    }, adminToken, 409);

    const [notificationRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications
       WHERE reference_type = 'order' AND reference_id IN (?, ?)`,
      [firstOrder.id, secondOrder.id],
    );
    assert.ok(notificationRows[0].total >= 8);
    console.log('PASS: checkout concurrency, snapshots, inventory, cancellation and status flow');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (orders.length > 0) {
      const placeholders = orders.map(() => '?').join(', ');
      await pool.execute(
        `DELETE FROM notifications WHERE reference_type = 'order' AND reference_id IN (${placeholders})`,
        orders,
      );
      await pool.execute(
        `DELETE FROM inventory_transactions WHERE reference_type = 'order' AND reference_id IN (${placeholders})`,
        orders,
      );
      await pool.execute(`DELETE FROM orders WHERE id IN (${placeholders})`, orders);
    }
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    for (const productId of products.reverse()) {
      await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    }
    if (promotionId) await pool.execute('DELETE FROM promotions WHERE id = ?', [promotionId]);
    if (shippingMethodId) {
      await pool.execute('DELETE FROM shipping_methods WHERE id = ?', [shippingMethodId]);
    }
    if (categoryId) await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
