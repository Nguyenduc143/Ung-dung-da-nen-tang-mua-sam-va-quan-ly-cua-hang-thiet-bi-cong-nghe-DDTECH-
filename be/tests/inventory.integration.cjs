// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test13-${randomUUID().slice(0, 10)}`;
  const users = [];
  const products = [];
  const variants = [];
  let categoryId;
  let server;

  try {
    for (const [index, role] of ['ADMIN', 'CUSTOMER'].entries()) {
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

    async function createProduct(suffix, stock, hasVariants = false) {
      const [result] = await pool.execute(
        `INSERT INTO products
           (category_id, name, slug, sku, price, stock, has_variants, status)
         VALUES (?, ?, ?, ?, 1000, ?, ?, 'ACTIVE')`,
        [
          categoryId,
          `${prefix}-${suffix}`,
          `${prefix}-${suffix}`,
          `${prefix}-${suffix}`,
          stock,
          hasVariants ? 1 : 0,
        ],
      );
      products.push(result.insertId);
      return result.insertId;
    }

    async function createVariant(productId, suffix, stock, status = 'ACTIVE') {
      const [result] = await pool.execute(
        `INSERT INTO product_variants
           (product_id, sku, variant_name, price, stock, status)
         VALUES (?, ?, ?, 1000, ?, ?)`,
        [productId, `${prefix}-${suffix}`, `${prefix}-${suffix}`, stock, status],
      );
      variants.push(result.insertId);
      return result.insertId;
    }

    const plainProductId = await createProduct('plain', 10);
    const variantProductId = await createProduct('variant-product', 10, true);
    const firstVariantId = await createVariant(variantProductId, 'variant-one', 3);
    const secondVariantId = await createVariant(variantProductId, 'variant-two', 7);
    const otherProductId = await createProduct('other-product', 2, true);
    const otherVariantId = await createVariant(otherProductId, 'other-variant', 2);
    await createVariant(variantProductId, 'inactive-variant', 0, 'INACTIVE');

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const adminToken = signAccessToken({ id: users[0], role: 'ADMIN' });
    const customerToken = signAccessToken({ id: users[1], role: 'CUSTOMER' });

    async function rawRequest(method, path, body, token) {
      const response = await fetch(base + path, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, json: await response.json() };
    }

    async function request(method, path, body, token, expected = 200) {
      const result = await rawRequest(method, path, body, token);
      assert.equal(result.status, expected, `${method} ${path}: ${JSON.stringify(result.json)}`);
      return result.json.data;
    }

    await request('GET', '/admin/inventory', undefined, undefined, 401);
    await request('GET', '/admin/inventory', undefined, customerToken, 403);
    await request('POST', '/admin/inventory/adjust', {
      productId: plainProductId, quantity: 1,
    }, customerToken, 403);

    const inventory = await request(
      'GET', `/admin/inventory?search=${encodeURIComponent(prefix)}&page=1&limit=20`,
      undefined, adminToken,
    );
    const variantProduct = inventory.products.find((item) => item.id === variantProductId);
    assert.equal(variantProduct.stock, 10);
    assert.equal(variantProduct.variants.length, 3);

    await request('PATCH', `/admin/products/${plainProductId}`, {
      stock: 999,
    }, adminToken, 422);
    await request('PATCH', `/admin/variants/${firstVariantId}`, {
      stock: 999,
    }, adminToken, 422);
    await request('POST', '/admin/inventory/adjust', {
      productId: plainProductId, quantity: 0,
    }, adminToken, 422);
    await request('POST', '/admin/inventory/import', {
      productId: plainProductId, quantity: -1,
    }, adminToken, 422);
    await request('POST', '/admin/inventory/adjust', {
      productId: plainProductId, quantity: -2, type: 'IMPORT',
    }, adminToken, 422);

    const adjustedPlain = await request('POST', '/admin/inventory/adjust', {
      productId: plainProductId,
      quantity: -2,
      note: 'Điều chỉnh kiểm kê',
    }, adminToken, 201);
    assert.equal(adjustedPlain.transaction.type, 'ADJUSTMENT');
    assert.equal(adjustedPlain.transaction.stockAfter, 8);
    assert.equal(adjustedPlain.transaction.createdBy.id, users[0]);
    assert.equal(adjustedPlain.stock.productStock, 8);

    const concurrentResults = await Promise.all([
      rawRequest('POST', '/admin/inventory/adjust', {
        productId: plainProductId, quantity: -5, note: 'Concurrent one',
      }, adminToken),
      rawRequest('POST', '/admin/inventory/adjust', {
        productId: plainProductId, quantity: -5, note: 'Concurrent two',
      }, adminToken),
    ]);
    assert.deepEqual(concurrentResults.map((result) => result.status).sort(), [201, 409]);
    let [stockRows] = await pool.execute('SELECT stock FROM products WHERE id = ?', [plainProductId]);
    assert.equal(stockRows[0].stock, 3);

    const importedPlain = await request('POST', '/admin/inventory/import', {
      productId: plainProductId,
      quantity: 5,
      note: 'Nhập thêm hàng',
    }, adminToken, 201);
    assert.equal(importedPlain.transaction.type, 'IMPORT');
    assert.equal(importedPlain.stock.productStock, 8);

    await request('POST', '/admin/inventory/adjust', {
      productId: variantProductId, quantity: 1,
    }, adminToken, 422);
    await request('POST', '/admin/inventory/adjust', {
      productId: plainProductId, variantId: firstVariantId, quantity: 1,
    }, adminToken, 422);
    await request('POST', '/admin/inventory/adjust', {
      productId: variantProductId, variantId: otherVariantId, quantity: 1,
    }, adminToken, 422);

    const adjustedVariant = await request('POST', '/admin/inventory/adjust', {
      productId: variantProductId,
      variantId: firstVariantId,
      quantity: -2,
      note: 'Xuất điều chỉnh',
    }, adminToken, 201);
    assert.equal(adjustedVariant.stock.variantStock, 1);
    assert.equal(adjustedVariant.stock.productStock, 8);
    const importedVariant = await request('POST', '/admin/inventory/import', {
      productId: variantProductId,
      variantId: firstVariantId,
      quantity: 3,
    }, adminToken, 201);
    assert.equal(importedVariant.stock.variantStock, 4);
    assert.equal(importedVariant.stock.productStock, 11);

    [stockRows] = await pool.execute(
      `SELECT p.stock AS productStock, pv.stock AS variantStock
       FROM products p JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.id = ? AND pv.id = ?`,
      [variantProductId, firstVariantId],
    );
    assert.equal(stockRows[0].productStock, 11);
    assert.equal(stockRows[0].variantStock, 4);

    const lowStock = await request(
      'GET', '/admin/inventory/low-stock?threshold=4', undefined, adminToken,
    );
    assert.ok(lowStock.items.some((item) => item.variant?.id === firstVariantId));
    assert.ok(lowStock.items.some((item) => item.variant?.id === otherVariantId));
    assert.equal(lowStock.items.some((item) => item.variant?.sku === `${prefix}-inactive-variant`), false);

    const transactions = await request(
      'GET',
      `/admin/inventory/transactions?productId=${variantProductId}&variantId=${firstVariantId}&page=1&limit=10`,
      undefined,
      adminToken,
    );
    assert.equal(transactions.pagination.total, 2);
    assert.deepEqual(
      new Set(transactions.transactions.map((transaction) => transaction.type)),
      new Set(['ADJUSTMENT', 'IMPORT']),
    );

    const [plainLogs] = await pool.execute(
      `SELECT COUNT(*) AS total FROM inventory_transactions
       WHERE product_id = ? AND created_by = ?`,
      [plainProductId, users[0]],
    );
    assert.equal(plainLogs[0].total, 3);

    console.log('PASS: inventory history, variant sync, low stock, validation and concurrent locking');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const productId of products) {
      await pool.execute('DELETE FROM inventory_transactions WHERE product_id = ?', [productId]);
    }
    for (const productId of products.reverse()) {
      await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    }
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    if (categoryId) await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
