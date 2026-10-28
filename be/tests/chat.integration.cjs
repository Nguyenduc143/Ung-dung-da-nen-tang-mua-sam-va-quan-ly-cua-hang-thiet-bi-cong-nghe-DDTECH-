process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createServer } = require('node:http');
const { io: client } = require('socket.io-client');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { initializeSocket } = require('../dist/socket');
const { signAccessToken } = require('../dist/utils/token');

async function main() {
  const ids = [], clients = [];
  const prefix = `chat-test-${randomUUID()}`;
  const server = createServer(app), io = initializeSocket(server);
  let checks = 0;
  const equal = (a, b) => { assert.deepEqual(a, b); checks++; };
  const waitUntil = async predicate => {
    const deadline = Date.now() + 3000;
    while (!predicate()) { if (Date.now() > deadline) throw Error('Socket event timeout'); await new Promise(r => setTimeout(r, 10)); }
  };
  try {
    const [[before]] = await pool.query('SELECT (SELECT COUNT(*) FROM chat_conversations) conversations, (SELECT COUNT(*) FROM chat_messages) messages');
    for (let i = 0; i < 4; i++) {
      const [result] = await pool.execute("INSERT INTO users (full_name,email,password_hash,role,status) VALUES (?,?,'test-only-no-login',?,'ACTIVE')",
        [`${prefix}-${i}`, `${prefix}-${i}@example.invalid`, i < 2 ? 'CUSTOMER' : 'ADMIN']);
      ids.push(result.insertId);
    }
    const tokens = ids.map((id, i) => signAccessToken({ id, role: i < 2 ? 'CUSTOMER' : 'ADMIN', authVersion: 0 }));
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = async (method, path, body, token, status = 200) => {
      const res = await fetch(origin + '/api' + path, { method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body) });
      const json = await res.json(); equal(res.status, status); return json.data;
    };
    const events = [[], [], []];
    for (const [index, token] of [tokens[0], tokens[1], tokens[2]].entries()) {
      const socket = client(origin, { auth: { token }, transports: ['websocket'], reconnection: false });
      clients.push(socket);
      socket.onAny((event, data) => events[index].push({ event, data }));
      await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    }
    await request('GET', '/chat/conversations', undefined, undefined, 401);
    await request('GET', '/admin/chat/conversations', undefined, tokens[0], 403);
    await request('POST', '/chat/conversations', { customerId: ids[1] }, tokens[0], 422);
    await request('POST', '/chat/conversations', {}, tokens[2], 403);
    const opened = await Promise.all([0, 1].map(() => request('POST', '/chat/conversations', {}, tokens[0])));
    equal(opened[0].conversation.id, opened[1].conversation.id);
    const first = opened[0];
    const id = first.conversation.id, base = `/chat/conversations/${id}`, adminBase = `/admin/chat/conversations/${id}`;
    const again = await request('POST', '/chat/conversations', {}, tokens[0]); equal(again.conversation.id, id);
    await request('GET', `/chat/conversations/${id}`, undefined, tokens[1], 404);
    await request('GET', '/chat/conversations/0', undefined, tokens[0], 422);
    await request('GET', '/chat/conversations?limit=101', undefined, tokens[0], 422);
    await request('GET', '/chat/conversations?unknown=1', undefined, tokens[0], 422);
    await request('POST', adminBase + '/messages', { clientMessageId: 'early', content: 'Hello' }, tokens[2], 403);
    await request('POST', base + '/messages', { clientMessageId: 'empty', content: ' ' }, tokens[0], 422);
    await request('POST', base + '/messages', { clientMessageId: 'long', content: 'a'.repeat(4001) }, tokens[0], 422);
    await request('POST', base + '/messages', { clientMessageId: 'spoof', content: 'Hi', senderId: ids[1] }, tokens[0], 422);
    const content = "Xin chào 👋 ' OR 1=1 --";
    const sent = await Promise.all([0, 1].map(() => request('POST', base + '/messages', { clientMessageId: 'first', content }, tokens[0])));
    equal(sent[0].message.id, sent[1].message.id); equal(sent.filter(m => !m.duplicate).length, 1);
    equal(sent[0].message.content, content);
    await waitUntil(() => events[0].filter(e => e.event === 'chat:message-created').length === 1 && events[2].some(e => e.event === 'chat:message-created'));
    equal(events[1].length, 0);
    await request('POST', base + '/messages', { clientMessageId: 'first', content: 'Different' }, tokens[0], 409);
    const claim = async token => {
      const res = await fetch(origin + '/api' + adminBase + '/claim', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: '{}' });
      return { status: res.status, json: await res.json(), token };
    };
    const claims = await Promise.all([claim(tokens[2]), claim(tokens[3])]);
    equal(claims.map(c => c.status).sort(), [200, 409]);
    const winner = claims.find(c => c.status === 200), loser = claims.find(c => c.status === 409);
    equal(winner.json.data.conversation.unreadCount, 1);
    await request('POST', adminBase + '/messages', { clientMessageId: 'wrong-admin', content: 'Hi' }, loser.token, 403);
    const reply = await request('POST', adminBase + '/messages', { clientMessageId: 'reply', content: 'Cửa hàng xin chào' }, winner.token);
    equal(reply.message.messageSeq, 2);
    await waitUntil(() => events[0].some(e => e.data.message?.id === reply.message.id));
    const detail = await request('GET', base, undefined, tokens[0]); equal(detail.conversation.unreadCount, 1);
    const page = await request('GET', base + '/messages?limit=1', undefined, tokens[0]);
    equal(page.messages[0].messageSeq, 2); equal(page.pagination.hasMore, true); equal(page.pagination.nextBeforeSeq, 2);
    const older = await request('GET', base + '/messages?beforeSeq=2&limit=1', undefined, tokens[0]);
    equal(older.messages[0].messageSeq, 1); equal(older.pagination.hasMore, false);
    await request('PATCH', base + '/read', { readSeq: 999 }, tokens[0], 422);
    const read = await request('PATCH', base + '/read', { readSeq: 2 }, tokens[0]); equal(read.conversation.unreadCount, 0);
    const regressed = await request('PATCH', base + '/read', { readSeq: 1 }, tokens[0]); equal(regressed.conversation.customerReadSeq, 2);
    await request('PATCH', adminBase + '/read', { readSeq: 2 }, loser.token, 403);
    await request('PATCH', adminBase + '/read', { readSeq: 2 }, winner.token);
    const inbox = await request('GET', '/admin/chat/conversations?status=OPEN', undefined, winner.token);
    equal(inbox.conversations.some(c => c.id === id), true);
    const personal = await request('GET', '/chat/conversations', undefined, tokens[1]); equal(personal.pagination.total, 0);
    await pool.execute('UPDATE users SET auth_version=auth_version+1 WHERE id=?', [ids[0]]);
    const freshToken = signAccessToken({ id: ids[0], role: 'CUSTOMER', authVersion: 1 });
    await request('POST', adminBase + '/messages', { clientMessageId: 'revoked', content: 'Private follow-up' }, winner.token);
    await waitUntil(() => !clients[0].connected);
    equal(events[0].some(e => e.data.message?.clientMessageId === 'revoked'), false);
    await request('GET', base, undefined, tokens[0], 401);
    const closed = await request('POST', base + '/close', {}, freshToken); equal(closed.conversation.status, 'CLOSED');
    await request('POST', base + '/messages', { clientMessageId: 'closed', content: 'Hi' }, freshToken, 409);
    const unchanged = await request('GET', base, undefined, freshToken); equal(unchanged.conversation.lastMessageSeq, 3);
    const retry = await request('POST', base + '/messages', { clientMessageId: 'first', content }, freshToken); equal(retry.duplicate, true);
    const newChat = await request('POST', '/chat/conversations', {}, freshToken); equal(newChat.conversation.id !== id, true);
    equal(events[1].length, 0);
    // Delete ONLY rows belonging to the four unique test-owned accounts.
    await pool.query('DELETE m FROM chat_messages m JOIN chat_conversations c ON c.id=m.conversation_id WHERE c.customer_id IN (?,?)', ids.slice(0, 2));
    await pool.query('DELETE FROM chat_conversations WHERE customer_id IN (?,?)', ids.slice(0, 2));
    const [[after]] = await pool.query('SELECT (SELECT COUNT(*) FROM chat_conversations) conversations, (SELECT COUNT(*) FROM chat_messages) messages'); equal(after, before);
    console.log(JSON.stringify({ passed: checks, httpAndSocket: true, concurrency: true, privateRooms: true, testDataRemoved: true }));
  } finally {
    for (const socket of clients) socket.disconnect();
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      await pool.query(`DELETE m FROM chat_messages m JOIN chat_conversations c ON c.id=m.conversation_id WHERE c.customer_id IN (${placeholders})`, ids);
      await pool.query(`DELETE FROM chat_conversations WHERE customer_id IN (${placeholders})`, ids);
      await pool.query(`DELETE FROM users WHERE id IN (${placeholders}) AND email LIKE ?`, [...ids, `${prefix}%@example.invalid`]);
    }
    await new Promise(r => io.close(r));
    if (server.listening) await new Promise(r => server.close(r));
    await pool.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
