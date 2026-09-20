// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');

(async () => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const email = `test16-${suffix}@example.invalid`;
  const phone = `09${String(Date.now()).slice(-8)}`;
  const password = 'Password123!';
  let userId;
  let server;

  try {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;

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

    const registered = await request('POST', '/auth/register', {
      fullName: 'Test Auth Part 16', email, phone, password,
    }, undefined, 201);
    userId = registered.user.id;
    assert.equal(registered.user.email, email);
    assert.equal(registered.user.role, 'CUSTOMER');
    assert.equal('passwordHash' in registered.user, false);

    await request('POST', '/auth/register', {
      fullName: 'Duplicate Email', email, phone: `08${String(Date.now()).slice(-8)}`, password,
    }, undefined, 409);
    await request('POST', '/auth/login', { email, password: 'wrong-password' }, undefined, 401);

    const loggedIn = await request('POST', '/auth/login', { email, password });
    assert.ok(loggedIn.accessToken);
    assert.ok(loggedIn.refreshToken);
    const profile = await request('GET', '/auth/me', undefined, loggedIn.accessToken);
    assert.equal(profile.user.id, userId);

    const [storedTokens] = await pool.execute(
      'SELECT token_hash AS tokenHash FROM refresh_tokens WHERE user_id = ?',
      [userId],
    );
    assert.equal(storedTokens.length, 1);
    assert.notEqual(storedTokens[0].tokenHash, loggedIn.refreshToken);
    assert.equal(
      storedTokens[0].tokenHash,
      createHash('sha256').update(loggedIn.refreshToken).digest('hex'),
    );

    const rotated = await request('POST', '/auth/refresh-token', {
      refreshToken: loggedIn.refreshToken,
    });
    assert.notEqual(rotated.accessToken, loggedIn.accessToken);
    assert.notEqual(rotated.refreshToken, loggedIn.refreshToken);
    await request('POST', '/auth/refresh-token', {
      refreshToken: loggedIn.refreshToken,
    }, undefined, 401);

    await request('POST', '/auth/logout', { refreshToken: rotated.refreshToken });
    await request('POST', '/auth/refresh-token', {
      refreshToken: rotated.refreshToken,
    }, undefined, 401);

    const secondLogin = await request('POST', '/auth/login', { email, password });
    await request('POST', '/auth/logout-all', {}, secondLogin.accessToken);
    await request('POST', '/auth/refresh-token', {
      refreshToken: secondLogin.refreshToken,
    }, undefined, 401);

    const lockedLogin = await request('POST', '/auth/login', { email, password });
    await pool.execute("UPDATE users SET status = 'LOCKED' WHERE id = ?", [userId]);
    await request('GET', '/auth/me', undefined, lockedLogin.accessToken, 401);
    await request('POST', '/auth/login', { email, password }, undefined, 403);

    console.log('PASS: auth register, duplicate, login, access, refresh rotation and logout');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (userId) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
