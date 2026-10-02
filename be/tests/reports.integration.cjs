// Run after npm run build and npm run db:procedures.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `report-${randomUUID().replaceAll('-', '').slice(0, 10)}`;
  const userIds = [];
  let server;

  try {
    for (const role of ['ADMIN', 'CUSTOMER']) {
      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [`${prefix}-${role}`, `${prefix}-${role.toLowerCase()}@example.invalid`, 'test-only', role],
      );
      userIds.push(result.insertId);
    }

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const adminToken = signAccessToken({ id: userIds[0], role: 'ADMIN', authVersion: 0 });
    const customerToken = signAccessToken({ id: userIds[1], role: 'CUSTOMER', authVersion: 0 });

    async function request(path, token, expected = 200) {
      const response = await fetch(base + path, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (response.status !== expected) {
        assert.equal(response.status, expected, `GET ${path}: ${await response.text()}`);
      }
      return response;
    }

    await request('/admin/reports/revenue', undefined, 401);
    await request('/admin/reports/revenue', customerToken, 403);

    const revenue = await (await request('/admin/reports/revenue', adminToken)).json();
    assert.equal(revenue.success, true);
    assert.equal(revenue.data.points.length, 30);

    const orders = await (await request('/admin/reports/orders?status=DELIVERED', adminToken)).json();
    assert.ok(Array.isArray(orders.data.orders));
    assert.equal(typeof orders.data.pagination.total, 'number');

    const products = await (await request('/admin/reports/products?limit=5', adminToken)).json();
    assert.ok(Array.isArray(products.data.products));

    const inventory = await (await request('/admin/reports/inventory?type=SALE', adminToken)).json();
    assert.ok(Array.isArray(inventory.data.transactions));

    const csv = await request('/admin/reports/export?report=revenue&format=csv', adminToken);
    assert.match(csv.headers.get('content-type') ?? '', /^text\/csv/);
    assert.match(csv.headers.get('content-disposition') ?? '', /\.csv"$/);
    assert.ok((await csv.arrayBuffer()).byteLength > 10);

    const xlsx = await request('/admin/reports/export?report=orders&format=xlsx', adminToken);
    assert.match(
      xlsx.headers.get('content-type') ?? '',
      /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/,
    );
    const xlsxBytes = new Uint8Array(await xlsx.arrayBuffer());
    assert.equal(String.fromCharCode(xlsxBytes[0], xlsxBytes[1]), 'PK');

    await request('/admin/reports/revenue?from=2026-01-01', adminToken, 422);
    await request('/admin/reports/revenue?from=2025-01-01&to=2026-12-31', adminToken, 422);
    await request('/admin/reports/orders?limit=101', adminToken, 422);
    await request('/admin/reports/export?report=invalid&format=csv', adminToken, 422);

    console.log('PASS: admin reports data, authorization, validation, CSV and XLSX export');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (userIds.length > 0) {
      await pool.query('DELETE FROM users WHERE id IN (?)', [userIds]);
    }
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
