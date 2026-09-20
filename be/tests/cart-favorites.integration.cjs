// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test07-${randomUUID().slice(0, 12)}`;
  const users = [];
  const products = [];
  const variants = [];
  let categoryId;
  let server;

  try {
    for (let index = 1; index <= 2; index += 1) {
      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [`${prefix}-${index}`, `${prefix}-${index}@example.invalid`, 'test-only-no-login', 'CUSTOMER'],
      );
      users.push(result.insertId);
    }
    const [categoryResult] = await pool.execute(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [prefix, `${prefix}-category`],
    );
    categoryId = categoryResult.insertId;

    async function createProduct(suffix, data = {}) {
      const [result] = await pool.execute(
        `INSERT INTO products
           (category_id, name, slug, sku, price, sale_price, stock, has_variants, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          `${prefix}-${suffix}`,
          `${prefix}-${suffix}`,
          `${prefix}-${suffix}`,
          data.price ?? 100,
          data.salePrice ?? null,
          data.stock ?? 5,
          data.hasVariants ? 1 : 0,
          data.status ?? 'ACTIVE',
        ],
      );
      products.push(result.insertId);
      return result.insertId;
    }

    const plainProductId = await createProduct('plain', { price: 100, salePrice: 90, stock: 5 });
    const variantProductId = await createProduct('variant', { price: 200, stock: 4, hasVariants: true });
    const otherProductId = await createProduct('other', { price: 300, stock: 3, hasVariants: true });
    const inactiveProductId = await createProduct('inactive', { status: 'INACTIVE' });
    const [variantResult] = await pool.execute(
      `INSERT INTO product_variants
         (product_id, sku, variant_name, price, sale_price, stock, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [variantProductId, `${prefix}-variant-a`, 'Variant A', 200, 180, 4],
    );
    variants.push(variantResult.insertId);
    const variantId = variantResult.insertId;
    const [otherVariantResult] = await pool.execute(
      `INSERT INTO product_variants
         (product_id, sku, variant_name, price, stock, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [otherProductId, `${prefix}-variant-other`, 'Other variant', 300, 3],
    );
    variants.push(otherVariantResult.insertId);
    const otherVariantId = otherVariantResult.insertId;
    await pool.execute(
      `INSERT INTO product_images (product_id, image_url, is_primary)
       VALUES (?, ?, 1)`,
      [plainProductId, 'https://example.com/cart-product.png'],
    );

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const firstToken = signAccessToken({ id: users[0], role: 'CUSTOMER' });
    const secondToken = signAccessToken({ id: users[1], role: 'CUSTOMER' });

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

    await request('GET', '/cart', undefined, undefined, 401);
    let cart = await request('GET', '/cart', undefined, firstToken);
    assert.equal(cart.items.length, 0);
    assert.equal(cart.summary.totalItems, 0);

    await request('POST', '/cart/items', {
      productId: plainProductId, variantId: null, quantity: 0,
    }, firstToken, 422);
    cart = await request('POST', '/cart/items', {
      productId: plainProductId, variantId: null, quantity: 2,
    }, firstToken, 201);
    const plainItemId = cart.items[0].id;
    assert.equal(cart.items[0].currentPrice, 90);
    assert.equal(cart.items[0].quantity, 2);
    assert.equal(cart.items[0].imageUrl, 'https://example.com/cart-product.png');

    cart = await request('POST', '/cart/items', {
      productId: plainProductId, quantity: 3,
    }, firstToken, 201);
    assert.equal(cart.items.find((item) => item.id === plainItemId).quantity, 5);
    await request('POST', '/cart/items', {
      productId: plainProductId, quantity: 1,
    }, firstToken, 409);
    await request('PATCH', `/cart/items/${plainItemId}`, { quantity: 0 }, firstToken, 422);
    await request('PATCH', `/cart/items/${plainItemId}`, { quantity: 1 }, secondToken, 404);

    cart = await request('PATCH', `/cart/items/${plainItemId}`, { quantity: 4 }, firstToken);
    assert.equal(cart.items.find((item) => item.id === plainItemId).quantity, 4);
    await pool.execute('UPDATE products SET sale_price = ? WHERE id = ?', [80, plainProductId]);
    cart = await request('GET', '/cart', undefined, firstToken);
    assert.equal(cart.items.find((item) => item.id === plainItemId).currentPrice, 80);
    assert.equal(cart.summary.subtotal, 320);

    await request('POST', '/cart/items', {
      productId: variantProductId, quantity: 1,
    }, firstToken, 422);
    await request('POST', '/cart/items', {
      productId: variantProductId, variantId: otherVariantId, quantity: 1,
    }, firstToken, 422);
    cart = await request('POST', '/cart/items', {
      productId: variantProductId, variantId, quantity: 2,
    }, firstToken, 201);
    const variantItem = cart.items.find((item) => item.variant?.id === variantId);
    assert.equal(variantItem.currentPrice, 180);
    assert.equal(variantItem.availableStock, 4);
    assert.equal(cart.summary.totalItems, 6);
    await request('POST', '/cart/items', {
      productId: inactiveProductId, quantity: 1,
    }, firstToken, 409);

    await pool.execute("UPDATE products SET status = 'INACTIVE' WHERE id = ?", [plainProductId]);
    cart = await request('GET', '/cart', undefined, firstToken);
    assert.equal(cart.items.find((item) => item.id === plainItemId).isAvailable, false);
    await pool.execute("UPDATE products SET status = 'ACTIVE' WHERE id = ?", [plainProductId]);

    await request('DELETE', `/cart/items/${variantItem.id}`, undefined, secondToken, 404);
    await request('DELETE', `/cart/items/${variantItem.id}`, undefined, firstToken);
    cart = await request('GET', '/cart', undefined, firstToken);
    assert.equal(cart.items.length, 1);

    let favorites = await request('GET', '/favorites', undefined, firstToken);
    assert.equal(favorites.favorites.length, 0);
    const favoriteData = await request('POST', `/favorites/${plainProductId}`, undefined, firstToken, 201);
    assert.equal(favoriteData.favorite.product.id, plainProductId);
    await request('POST', `/favorites/${plainProductId}`, undefined, firstToken, 409);
    await request('POST', `/favorites/${plainProductId}`, undefined, secondToken, 201);
    await request('POST', `/favorites/${inactiveProductId}`, undefined, firstToken, 409);
    favorites = await request('GET', '/favorites', undefined, firstToken);
    assert.equal(favorites.favorites.length, 1);
    assert.equal(favorites.favorites[0].product.imageUrl, 'https://example.com/cart-product.png');
    await request('DELETE', `/favorites/${plainProductId}`, undefined, firstToken);
    await request('DELETE', `/favorites/${plainProductId}`, undefined, firstToken, 404);

    const cleared = await request('DELETE', '/cart', undefined, firstToken);
    assert.equal(cleared.removedCount, 1);
    cart = await request('GET', '/cart', undefined, firstToken);
    assert.equal(cart.items.length, 0);
    console.log('PASS: cart ownership, quantity, stock, variants, current price and favorites');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    for (const productId of products.reverse()) {
      await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    }
    if (categoryId) await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
