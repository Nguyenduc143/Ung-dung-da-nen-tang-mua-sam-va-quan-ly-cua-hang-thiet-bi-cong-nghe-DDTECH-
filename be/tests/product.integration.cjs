// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test06-${randomUUID().slice(0, 12)}`;
  const users = [];
  const categories = [];
  const brands = [];
  const products = [];
  let server;

  try {
    for (const role of ['ADMIN', 'CUSTOMER']) {
      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [prefix, `${prefix}-${role}@example.invalid`, 'test-only-no-login', role],
      );
      users.push(result.insertId);
    }
    const [categoryResult] = await pool.execute(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [prefix, `${prefix}-category`],
    );
    categories.push(categoryResult.insertId);
    const [brandResult] = await pool.execute(
      'INSERT INTO brands (name, slug) VALUES (?, ?)',
      [prefix, `${prefix}-brand`],
    );
    brands.push(brandResult.insertId);

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const admin = signAccessToken({ id: users[0], role: 'ADMIN' });
    const customer = signAccessToken({ id: users[1], role: 'CUSTOMER' });

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

    await request('GET', '/products');
    await request('POST', '/admin/products', {}, undefined, 401);
    await request('POST', '/admin/products', {}, customer, 403);
    await request('POST', '/admin/products', {
      categoryId: categories[0], name: prefix, sku: `${prefix}-invalid`, price: 10, salePrice: 11,
    }, admin, 422);

    const created = await request('POST', '/admin/products', {
      categoryId: categories[0],
      brandId: brands[0],
      name: `Điện thoại ${prefix}`,
      sku: `${prefix}-product`,
      price: 1000,
      stock: 99,
      hasVariants: true,
      specifications: { storage: '128GB' },
      isFeatured: true,
      isNew: true,
    }, admin, 201);
    const product = created.product;
    products.push(product.id);
    assert.ok(product.slug.startsWith('dien-thoai-'));
    assert.equal(product.stock, 0);

    await request('POST', '/admin/products', {
      categoryId: categories[0], name: 'Duplicate slug', slug: product.slug,
      sku: `${prefix}-other-sku`, price: 1,
    }, admin, 409);
    await request('POST', '/admin/products', {
      categoryId: categories[0], name: 'Duplicate sku',
      sku: product.sku, price: 1,
    }, admin, 409);

    const firstVariantData = await request('POST', `/admin/products/${product.id}/variants`, {
      sku: `${prefix}-128`, variantName: '128GB', attributes: { storage: '128GB' },
      price: 1000, salePrice: 900, stock: 3,
    }, admin, 201);
    const firstVariant = firstVariantData.variant;
    const secondVariantData = await request('POST', `/admin/products/${product.id}/variants`, {
      sku: `${prefix}-256`, variantName: '256GB', attributes: { storage: '256GB' },
      price: 800, stock: 5,
    }, admin, 201);
    const secondVariant = secondVariantData.variant;

    let detail = await request('GET', `/products/${product.id}`);
    assert.equal(detail.product.stock, 8);
    assert.equal(detail.product.price, 800);
    assert.equal(detail.product.salePrice, null);
    assert.equal(detail.variants.length, 2);
    assert.deepEqual(detail.specifications, { storage: '128GB' });
    await request('GET', `/products/slug/${product.slug}`);

    await request('PATCH', `/admin/variants/${firstVariant.id}`, { salePrice: 1001 }, admin, 422);
    await request('PATCH', `/admin/variants/${firstVariant.id}`, { stock: 7 }, admin, 422);
    await request('PATCH', `/admin/variants/${firstVariant.id}`, { salePrice: 700 }, admin);
    detail = await request('GET', `/products/${product.id}`);
    assert.equal(detail.product.stock, 8);
    assert.equal(detail.product.price, 1000);
    assert.equal(detail.product.salePrice, 700);

    const imageOneData = await request('POST', `/admin/products/${product.id}/images`, {
      variantId: firstVariant.id,
      imageUrl: 'https://example.com/one.png',
    }, admin, 201);
    assert.equal(imageOneData.image.isPrimary, true);
    const imageTwoData = await request('POST', `/admin/products/${product.id}/images`, {
      imageUrl: 'https://example.com/two.png', isPrimary: true,
    }, admin, 201);
    detail = await request('GET', `/products/${product.id}`);
    assert.equal(detail.images.filter((image) => image.isPrimary).length, 1);
    assert.equal(detail.images.find((image) => image.isPrimary).id, imageTwoData.image.id);

    const plainProductData = await request('POST', '/admin/products', {
      categoryId: categories[0], name: `${prefix} plain`, sku: `${prefix}-plain`, price: 500, stock: 2,
    }, admin, 201);
    const plainProduct = plainProductData.product;
    products.push(plainProduct.id);
    await request('POST', `/admin/products/${plainProduct.id}/images`, {
      variantId: firstVariant.id, imageUrl: 'https://example.com/wrong.png',
    }, admin, 422);
    await request('POST', `/admin/products/${plainProduct.id}/variants`, {
      sku: `${prefix}-not-enabled`, variantName: 'Not enabled', price: 1,
    }, admin, 409);

    const filtered = await request(
      'GET',
      `/products?search=${encodeURIComponent(prefix)}&category=${categories[0]}&brand=${brands[0]}&minPrice=600&maxPrice=800&featured=true&new=true&sort=price_asc&page=1&limit=10`,
    );
    assert.ok(filtered.products.some((item) => item.id === product.id));
    assert.equal(filtered.pagination.page, 1);

    await request('DELETE', `/admin/product-images/${imageTwoData.image.id}`, undefined, admin);
    detail = await request('GET', `/products/${product.id}`);
    assert.equal(detail.images.find((image) => image.id === imageOneData.image.id).isPrimary, true);
    await request('PATCH', `/admin/product-images/${imageOneData.image.id}/primary`, undefined, admin);

    await request('DELETE', `/admin/variants/${secondVariant.id}`, undefined, admin, 409);
    await request('POST', '/admin/inventory/adjust', {
      productId: product.id, variantId: secondVariant.id, quantity: -5,
      note: 'Đưa tồn kho về 0 trước khi xóa phiên bản',
    }, admin, 201);
    await request('DELETE', `/admin/variants/${secondVariant.id}`, undefined, admin);
    detail = await request('GET', `/products/${product.id}`);
    assert.equal(detail.product.stock, 3);
    assert.equal(detail.variants.length, 1);

    await request('PATCH', `/admin/products/${plainProduct.id}`, { salePrice: 501 }, admin, 422);
    await request('PATCH', `/admin/products/${plainProduct.id}`, { salePrice: 450 }, admin);
    await request('DELETE', `/admin/products/${product.id}`, undefined, admin);
    await request('GET', `/products/${product.id}`, undefined, undefined, 404);
    const [deletedRows] = await pool.execute('SELECT deleted_at FROM products WHERE id = ?', [product.id]);
    assert.ok(deletedRows[0].deleted_at);

    await pool.execute("UPDATE users SET status = 'LOCKED' WHERE id = ?", [users[0]]);
    await request('PATCH', `/admin/products/${plainProduct.id}`, { name: 'Blocked' }, admin, 401);
    console.log('PASS: product filters, CRUD, variants, synchronized price/stock, images and soft delete');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const id of products.reverse()) {
      await pool.execute('DELETE FROM inventory_transactions WHERE product_id = ?', [id]);
      await pool.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
      await pool.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
      await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    }
    for (const id of brands) await pool.execute('DELETE FROM brands WHERE id = ?', [id]);
    for (const id of categories) await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    for (const id of users) {
      await pool.execute('DELETE FROM users WHERE id = ? AND full_name = ?', [id, prefix]);
    }
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
