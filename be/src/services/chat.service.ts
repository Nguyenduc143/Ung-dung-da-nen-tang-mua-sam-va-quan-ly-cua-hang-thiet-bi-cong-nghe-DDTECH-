import { withTransaction } from '../config/database';
import type { PoolConnection } from 'mysql2/promise';
import * as repository from '../repositories/chat.repository';
import { emitChatEvent } from '../socket';
import { AppError } from '../utils/app-error';
import type { ChatListQuery, ChatMessagesQuery, ChatSendInput } from '../validators/chat.validator';

const errors: Record<string, [number, string]> = {
  CHAT_UNAUTHORIZED: [401, 'Tài khoản không còn hoạt động'],
  CHAT_NOT_FOUND_OR_FORBIDDEN: [404, 'Không tìm thấy hội thoại'],
  CHAT_CUSTOMER_REQUIRED: [403, 'Chỉ khách hàng được mở hội thoại'],
  CHAT_ADMIN_REQUIRED: [403, 'Chỉ admin được nhận phụ trách'],
  CHAT_CLAIM_REQUIRED: [403, 'Bạn phải nhận phụ trách hội thoại trước'],
  CHAT_ALREADY_ASSIGNED: [409, 'Hội thoại đã có nhân viên phụ trách'],
  CHAT_CONVERSATION_CLOSED: [409, 'Hội thoại đã đóng'],
  CHAT_IDEMPOTENCY_CONFLICT: [409, 'Mã tin nhắn đã được dùng cho nội dung khác'],
  CHAT_INVALID_MESSAGE: [422, 'Tin nhắn không hợp lệ'],
  CHAT_INVALID_READ_SEQ: [422, 'Mốc đọc không hợp lệ'],
  CHAT_INVALID_LIMIT: [422, 'Giới hạn không hợp lệ'],
  CHAT_INVALID_PAGINATION_OR_STATUS: [422, 'Phân trang hoặc trạng thái không hợp lệ'],
};
async function run<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    const key = (error as { sqlMessage?: string }).sqlMessage;
    if (key && errors[key]) throw new AppError(...errors[key]);
    throw error;
  }
}
async function transaction<T>(operation: (connection: PoolConnection) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await withTransaction(operation); } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'ER_LOCK_DEADLOCK' && attempt < 2) continue;
      if (code === 'ER_LOCK_DEADLOCK' || code === 'ER_LOCK_WAIT_TIMEOUT') {
        throw new AppError(503, 'Hội thoại đang bận, vui lòng thử lại');
      }
      throw error;
    }
  }
}
const conversationResponse = (row: repository.ConversationRecord) => ({
  id: row.id, customerId: row.customer_id, customerName: row.customer_name,
  customerAvatarUrl: row.customer_avatar_url, assignedAdminId: row.assigned_admin_id,
  assignedAdminName: row.assigned_admin_name, status: row.status,
  lastMessageSeq: row.last_message_seq, customerReadSeq: row.customer_read_seq,
  adminReadSeq: row.admin_read_seq, unreadCount: Number(row.unread_count),
  lastMessageAt: row.last_message_at, closedAt: row.closed_at, createdAt: row.created_at, updatedAt: row.updated_at,
});
const messageResponse = (row: repository.MessageRecord) => ({
  id: row.id, conversationId: row.conversation_id, messageSeq: row.message_seq,
  senderId: row.sender_id, clientMessageId: row.client_message_id, content: row.content,
  createdAt: row.created_at,
});
async function publish(event: string, row: repository.ConversationRecord, extra = {}) {
  // Never send actor-dependent unreadCount to the other party. Clients can refetch.
  try { await emitChatEvent(row.customer_id, event, {
    conversationId: row.id, customerId: row.customer_id, assignedAdminId: row.assigned_admin_id,
    status: row.status, lastMessageSeq: row.last_message_seq,
    customerReadSeq: row.customer_read_seq, adminReadSeq: row.admin_read_seq, ...extra,
  }); } catch (error) { console.error('Không thể phát sự kiện chat sau commit:', error); }
}
export const list = (actor: number, query: ChatListQuery) => run(async () => {
  const result = await repository.listConversations(actor, query);
  return { conversations: result.conversations.map(conversationResponse), pagination: {
    page: query.page, limit: query.limit, total: result.total, totalPages: Math.ceil(result.total / query.limit),
  } };
});
export const detail = (actor: number, id: number) => run(async () => ({ conversation: conversationResponse(await repository.getConversation(actor, id)) }));
export const messages = (actor: number, id: number, query: ChatMessagesQuery) => run(async () => {
  const rows = await repository.listMessages(actor, id, { ...query, limit: Math.min(query.limit + 1, 100) });
  // At limit=100 use one extra read to determine whether an older page exists.
  const selected = rows.slice(0, query.limit);
  const last = selected.at(-1);
  const hasMore = rows.length > query.limit || (query.limit === 100 && last !== undefined &&
    (await repository.listMessages(actor, id, { beforeSeq: last.message_seq, limit: 1 })).length > 0);
  return { messages: selected.map(messageResponse), pagination: {
    limit: query.limit, hasMore, nextBeforeSeq: hasMore ? last?.message_seq : null,
  } };
});
export const open = (actor: number) => run(async () => {
  const row = await transaction(connection => repository.openConversation(actor, connection));
  await publish('chat:conversation-updated', row);
  return { conversation: conversationResponse(row) };
});
export const send = (actor: number, id: number, input: ChatSendInput) => run(async () => {
  const result = await transaction(async connection => {
    const message = await repository.sendMessage(actor, id, input, connection);
    const conversation = await repository.getConversation(actor, id, connection);
    return { message, conversation };
  });
  if (result.message.is_new === 1) await publish('chat:message-created', result.conversation, { message: messageResponse(result.message) });
  return { message: messageResponse(result.message), duplicate: result.message.is_new !== 1 };
});
export const claim = (actor: number, id: number) => run(async () => {
  const row = await transaction(connection => repository.claimConversation(actor, id, connection));
  await publish('chat:conversation-updated', row);
  return { conversation: conversationResponse(row) };
});
export const read = (actor: number, id: number, seq: number) => run(async () => {
  const row = await transaction(connection => repository.markRead(actor, id, seq, connection));
  await publish('chat:read', row, { readerId: actor });
  return { conversation: conversationResponse(row) };
});
export const close = (actor: number, id: number) => run(async () => {
  const row = await transaction(connection => repository.closeConversation(actor, id, connection));
  await publish('chat:conversation-closed', row);
  return { conversation: conversationResponse(row) };
});
