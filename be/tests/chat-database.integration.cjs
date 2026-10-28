const assert = require('node:assert/strict');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function main() {
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  let assertions = 0;
  const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
  const call = async (name, args) => {
    const [sets] = await db.query(`CALL ${name}(${args.map(() => '?').join(',')})`, args);
    return sets.filter(Array.isArray);
  };
  const rejects = async (name, args, code) => { await assert.rejects(call(name, args), error => error.sqlMessage === code); assertions++; };
  try {
    const [[target]] = await db.query('SELECT DATABASE() db, @@port port');
    check(target.db, 'ddtech'); check(target.port, 3307);
    const [customers] = await db.query("SELECT id FROM users WHERE role='CUSTOMER' AND status='ACTIVE' AND deleted_at IS NULL ORDER BY id LIMIT 2");
    const [admins] = await db.query("SELECT id FROM users WHERE role='ADMIN' AND status='ACTIVE' AND deleted_at IS NULL ORDER BY id LIMIT 2");
    assert(customers.length >= 2 && admins.length >= 1, 'Need two existing active customers and one admin; no test accounts will be created');
    const customer = customers[0].id, otherCustomer = customers[1].id, admin = admins[0].id;
    const [[before]] = await db.query('SELECT (SELECT COUNT(*) FROM chat_conversations) conversations, (SELECT COUNT(*) FROM chat_messages) messages');
    await db.beginTransaction();
    const [[conversation]] = await call('sp_chat_open_conversation', [customer]);
    const [[again]] = await call('sp_chat_open_conversation', [customer]); check(again.id, conversation.id);
    assert.equal(conversation.last_message_seq, 0, 'Run on a customer without existing chat messages');
    const id = conversation.id;
    await rejects('sp_chat_get_conversation', [otherCustomer, id], 'CHAT_NOT_FOUND_OR_FORBIDDEN');
    await rejects('sp_chat_get_conversation', [0, id], 'CHAT_UNAUTHORIZED');
    await rejects('sp_chat_open_conversation', [admin], 'CHAT_CUSTOMER_REQUIRED');
    await rejects('sp_chat_send_message', [admin, id, 'admin-early', 'Hello'], 'CHAT_CLAIM_REQUIRED');
    await rejects('sp_chat_send_message', [customer, id, 'empty', '  '], 'CHAT_INVALID_MESSAGE');
    await rejects('sp_chat_send_message', [customer, id, 'long', 'a'.repeat(4001)], 'CHAT_INVALID_MESSAGE');
    const [[first]] = await call('sp_chat_send_message', [customer, id, 'customer-1', 'Xin chào 👋']); check(first.message_seq, 1);
    const [[duplicate]] = await call('sp_chat_send_message', [customer, id, 'customer-1', 'Xin chào 👋']); check(duplicate.id, first.id);
    await rejects('sp_chat_send_message', [customer, id, 'customer-1', 'Changed'], 'CHAT_IDEMPOTENCY_CONFLICT');
    const [[claimed]] = await call('sp_chat_claim_conversation', [admin, id]); check(claimed.assigned_admin_id, admin); check(claimed.unread_count, 1);
    if (admins[1]) await rejects('sp_chat_claim_conversation', [admins[1].id, id], 'CHAT_ALREADY_ASSIGNED');
    const [[reply]] = await call('sp_chat_send_message', [admin, id, 'admin-1', 'Cửa hàng có thể giúp gì cho bạn?']); check(reply.message_seq, 2);
    const [[customerView]] = await call('sp_chat_get_conversation', [customer, id]); check(customerView.unread_count, 1);
    const [older] = await call('sp_chat_list_messages', [customer, id, 2, 20]); check(older.map(m => m.message_seq), [1]);
    await rejects('sp_chat_mark_read', [customer, id, 3], 'CHAT_INVALID_READ_SEQ');
    const [[read]] = await call('sp_chat_mark_read', [customer, id, 2]); check(read.unread_count, 0);
    const [[notBackwards]] = await call('sp_chat_mark_read', [customer, id, 1]); check(notBackwards.customer_read_seq, 2);
    const [[adminRead]] = await call('sp_chat_mark_read', [admin, id, 2]); check(adminRead.unread_count, 0);
    await rejects('sp_chat_list_messages', [customer, id, null, 101], 'CHAT_INVALID_LIMIT');
    const [list] = await call('sp_chat_list_conversations', [customer, 'OPEN', 20, 0]); check(list.every(c => c.customer_id === customer), true);
    const [[closed]] = await call('sp_chat_close_conversation', [admin, id]); check(closed.status, 'CLOSED');
    await rejects('sp_chat_send_message', [customer, id, 'closed-1', 'Hello'], 'CHAT_CONVERSATION_CLOSED');
    const [[newChat]] = await call('sp_chat_open_conversation', [customer]); check(newChat.id !== id, true);
    const [[oldChat]] = await call('sp_chat_get_conversation', [customer, id]); check(oldChat.last_message_seq, 2);
    await db.rollback();
    const [[after]] = await db.query('SELECT (SELECT COUNT(*) FROM chat_conversations) conversations, (SELECT COUNT(*) FROM chat_messages) messages'); check(after, before);
    console.log(JSON.stringify({ passed: assertions, testDataRolledBack: true }));
  } finally { await db.rollback(); await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
