// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { app } = require('../dist/app');
const { env } = require('../dist/config/env');
const { pool } = require('../dist/config/database');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `t15-${randomUUID().replaceAll('-', '').slice(0, 10)}`;
  const userIds = [];
  let server;

  try {
    async function createUser(role, status, suffix) {
      const [result] = await pool.execute(
        `INSERT INTO users (full_name, email, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?)`,
        [`${prefix}-${suffix}`, `${prefix}-${suffix}@example.invalid`, 'never-return-this-hash', role, status],
      );
      userIds.push(result.insertId);
      return result.insertId;
    }

    const adminId = await createUser('ADMIN', 'ACTIVE', 'admin');
    const customerId = await createUser('CUSTOMER', 'ACTIVE', 'customer');
    const lockedId = await createUser('CUSTOMER', 'LOCKED', 'locked');

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const adminToken = signAccessToken({ id: adminId, role: 'ADMIN' });
    const customerToken = signAccessToken({ id: customerId, role: 'CUSTOMER' });
    const staleAdminToken = signAccessToken({ id: customerId, role: 'ADMIN' });
    const lockedToken = signAccessToken({ id: lockedId, role: 'CUSTOMER' });

    async function rawRequest(path, options = {}) {
      const response = await fetch(base + path, options);
      const json = await response.json();
      return { response, json };
    }

    let result = await rawRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":',
    });
    assert.equal(result.response.status, 400);
    assert.deepEqual(
      { success: result.json.success, data: result.json.data },
      { success: false, data: null },
    );

    result = await rawRequest('/api/not-found?refreshToken=must-not-be-reflected');
    assert.equal(result.response.status, 404);
    assert.equal(result.json.message.includes('refreshToken'), false);

    result = await rawRequest('/api/health', {
      headers: { origin: 'https://attacker.example' },
    });
    assert.equal(result.response.status, 403);
    assert.equal(result.json.success, false);
    assert.equal(result.response.headers.get('access-control-allow-origin'), null);

    result = await rawRequest('/api/health');
    assert.equal(result.response.status, 200);
    assert.ok(result.response.headers.get('x-content-type-options'));
    assert.ok(result.response.headers.get('content-security-policy'));
    assert.equal(result.response.headers.get('x-powered-by'), null);

    result = await rawRequest('/api/users/me', {
      headers: { authorization: `Bearer ${customerToken}` },
    });
    assert.equal(result.response.status, 200);
    assert.equal('passwordHash' in result.json.data.user, false);
    assert.equal('password_hash' in result.json.data.user, false);

    result = await rawRequest('/api/cart', {
      headers: { authorization: `Bearer ${lockedToken}` },
    });
    assert.equal(result.response.status, 401);

    result = await rawRequest('/api/admin/dashboard/summary', {
      headers: { authorization: `Bearer ${staleAdminToken}` },
    });
    assert.equal(result.response.status, 403);

    result = await rawRequest('/api/admin/users?unexpected=1', {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(result.response.status, 422);
    assert.ok(result.json.errors);

    result = await rawRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Mass Assignment',
        email: `${prefix}-mass@example.invalid`,
        phone: '0912345678',
        password: 'Password123',
        role: 'ADMIN',
      }),
    });
    assert.equal(result.response.status, 422);
    const [massAssignmentUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [`${prefix}-mass@example.invalid`],
    );
    assert.equal(massAssignmentUsers.length, 0);

    const largeBody = JSON.stringify({ value: 'x'.repeat(1024 * 1024 + 100) });
    result = await rawRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: largeBody,
    });
    assert.equal(result.response.status, 413);
    assert.equal(result.json.success, false);

    for (let index = 0; index <= env.AUTH_LOGIN_RATE_LIMIT_MAX; index += 1) {
      result = await rawRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: `${prefix}-missing@example.invalid`,
          password: 'wrong-password',
        }),
      });
      assert.equal(
        result.response.status,
        index < env.AUTH_LOGIN_RATE_LIMIT_MAX ? 401 : 429,
      );
    }
    assert.ok(result.response.headers.get('retry-after'));
    assert.equal(result.json.success, false);

    for (let index = 0; index <= env.AUTH_REFRESH_RATE_LIMIT_MAX; index += 1) {
      result = await rawRequest('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid-refresh-token' }),
      });
      assert.equal(
        result.response.status,
        index < env.AUTH_REFRESH_RATE_LIMIT_MAX ? 401 : 429,
      );
    }
    assert.ok(result.response.headers.get('ratelimit-limit'));

    const productionEnv = {
      ...process.env,
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'change_me',
      JWT_REFRESH_SECRET: 'change_me',
    };
    const productionCheck = spawnSync(
      process.execPath,
      ['-e', "require('./dist/config/env')"],
      { cwd: process.cwd(), env: productionEnv, encoding: 'utf8' },
    );
    assert.notEqual(productionCheck.status, 0, 'Production must reject default JWT secrets');

    console.log('PASS: security headers, CORS, auth state, validation, safe errors and rate limits');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const userId of userIds.reverse()) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
