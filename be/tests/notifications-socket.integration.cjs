// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { randomUUID } = require('node:crypto');
const { io: createClient } = require('socket.io-client');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const {
  emitToAdmins,
  emitToAll,
  emitToUser,
  initializeSocket,
} = require('../dist/socket');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test12-${randomUUID().slice(0, 10)}`;
  const users = [];
  const notificationIds = [];
  const clients = [];
  const httpServer = createServer(app);
  const io = initializeSocket(httpServer);

  try {
    for (const [index, data] of [
      { role: 'CUSTOMER', status: 'ACTIVE' },
      { role: 'CUSTOMER', status: 'ACTIVE' },
      { role: 'ADMIN', status: 'ACTIVE' },
      { role: 'CUSTOMER', status: 'LOCKED' },
    ].entries()) {
      const [result] = await pool.execute(
        `INSERT INTO users (full_name, email, password_hash, role, status)
         VALUES (?, ?, 'test-only-no-login', ?, ?)`,
        [`${prefix}-${index}`, `${prefix}-${index}@example.invalid`, data.role, data.status],
      );
      users.push(result.insertId);
    }

    async function createNotification(userId, type, isRead = false) {
      const [result] = await pool.execute(
        `INSERT INTO notifications
           (user_id, title, message, type, reference_type, reference_id, is_read, read_at)
         VALUES (?, ?, ?, ?, 'test', 123, ?, ?)`,
        [
          userId,
          `${prefix} ${type}`,
          `${prefix} message`,
          type,
          isRead ? 1 : 0,
          isRead ? new Date() : null,
        ],
      );
      notificationIds.push(result.insertId);
      return result.insertId;
    }

    const firstNotificationId = await createNotification(users[0], 'ORDER');
    await createNotification(users[0], 'PAYMENT');
    await createNotification(users[0], 'SYSTEM', true);
    const otherNotificationId = await createNotification(users[1], 'ORDER');

    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${httpServer.address().port}`;
    const base = `${origin}/api`;
    const customerToken = signAccessToken({ id: users[0], role: 'CUSTOMER' });
    const otherCustomerToken = signAccessToken({ id: users[1], role: 'CUSTOMER' });
    const adminToken = signAccessToken({ id: users[2], role: 'ADMIN' });
    const lockedToken = signAccessToken({ id: users[3], role: 'CUSTOMER' });

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

    await request('GET', '/notifications', undefined, undefined, 401);
    await request('GET', '/notifications?unknown=true', undefined, customerToken, 422);
    const unreadOrders = await request(
      'GET', '/notifications?unreadOnly=true&type=ORDER&page=1&limit=10',
      undefined, customerToken,
    );
    assert.equal(unreadOrders.notifications.length, 1);
    assert.equal(unreadOrders.notifications[0].id, firstNotificationId);
    assert.equal(unreadOrders.notifications[0].isRead, false);
    assert.equal(unreadOrders.pagination.total, 1);

    let count = await request('GET', '/notifications/unread-count', undefined, customerToken);
    assert.equal(count.unreadCount, 2);
    await request(
      'PATCH', `/notifications/${firstNotificationId}/read`, { userId: users[1] },
      customerToken, 422,
    );
    await request(
      'PATCH', `/notifications/${otherNotificationId}/read`, {}, customerToken, 404,
    );
    const read = await request(
      'PATCH', `/notifications/${firstNotificationId}/read`, {}, customerToken,
    );
    assert.equal(read.isRead, true);
    assert.ok(read.readAt);
    const readAgain = await request(
      'PATCH', `/notifications/${firstNotificationId}/read`, {}, customerToken,
    );
    assert.equal(readAgain.readAt, read.readAt);
    const readAll = await request('PATCH', '/notifications/read-all', {}, customerToken);
    assert.equal(readAll.updatedCount, 1);
    count = await request('GET', '/notifications/unread-count', undefined, customerToken);
    assert.equal(count.unreadCount, 0);
    const otherCount = await request(
      'GET', '/notifications/unread-count', undefined, otherCustomerToken,
    );
    assert.equal(otherCount.unreadCount, 1);

    const expectRejected = (auth) => new Promise((resolve, reject) => {
      const socket = createClient(origin, {
        auth,
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });
      clients.push(socket);
      socket.once('connect', () => reject(new Error('Socket should have been rejected')));
      socket.once('connect_error', (error) => {
        try {
          assert.match(error.message, /Access token không hợp lệ/);
          resolve();
        } catch (assertionError) {
          reject(assertionError);
        }
      });
    });
    await expectRejected({});
    await expectRejected({ token: 'invalid-token' });
    await expectRejected({ token: lockedToken });

    const connect = (token) => new Promise((resolve, reject) => {
      const socket = createClient(origin, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });
      clients.push(socket);
      socket.once('connect', () => resolve(socket));
      socket.once('connect_error', reject);
    });
    const customerSocket = await connect(customerToken);
    const otherSocket = await connect(otherCustomerToken);
    const adminSocket = await connect(adminToken);

    assert.ok(io.sockets.adapter.rooms.get(`user:${users[0]}`)?.has(customerSocket.id));
    assert.ok(io.sockets.adapter.rooms.get(`user:${users[2]}`)?.has(adminSocket.id));
    assert.ok(io.sockets.adapter.rooms.get('role:ADMIN')?.has(adminSocket.id));
    assert.equal(io.sockets.adapter.rooms.get('role:ADMIN')?.has(customerSocket.id), false);

    const onceEvent = (socket, event) => new Promise((resolve) => socket.once(event, resolve));
    const userEvent = onceEvent(customerSocket, 'notification:new');
    emitToUser(users[0], 'notification:new', { id: 999, title: 'Realtime user' });
    assert.deepEqual(await userEvent, { id: 999, title: 'Realtime user' });

    let leakedToOtherUser = false;
    otherSocket.once('private:test', () => { leakedToOtherUser = true; });
    const privateEvent = onceEvent(customerSocket, 'private:test');
    emitToUser(users[0], 'private:test', { private: true });
    assert.deepEqual(await privateEvent, { private: true });
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(leakedToOtherUser, false);

    const adminEvent = onceEvent(adminSocket, 'order:new');
    emitToAdmins('order:new', { orderId: 123 });
    assert.deepEqual(await adminEvent, { orderId: 123 });

    const customerBroadcast = onceEvent(customerSocket, 'product:updated');
    const adminBroadcast = onceEvent(adminSocket, 'product:updated');
    emitToAll('product:updated', { productId: 456 });
    assert.deepEqual(await customerBroadcast, { productId: 456 });
    assert.deepEqual(await adminBroadcast, { productId: 456 });

    console.log('PASS: notification ownership, unread flow, authenticated sockets and rooms');
  } finally {
    for (const client of clients) client.close();
    await new Promise((resolve) => io.close(resolve));
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    for (const notificationId of notificationIds) {
      await pool.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);
    }
    for (const userId of users) await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
