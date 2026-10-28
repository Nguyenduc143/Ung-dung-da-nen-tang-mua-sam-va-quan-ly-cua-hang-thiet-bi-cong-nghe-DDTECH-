import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { executeProcedure, pool } from '../config/database';
import type { ChatListQuery, ChatMessagesQuery, ChatSendInput } from '../validators/chat.validator';

export interface ConversationRecord extends RowDataPacket {
  id: number; customer_id: number; assigned_admin_id: number | null;
  status: 'OPEN' | 'CLOSED'; last_message_seq: number; customer_read_seq: number; admin_read_seq: number;
  last_message_at: Date | null; closed_at: Date | null; created_at: Date; updated_at: Date;
  customer_name: string; customer_avatar_url: string | null; assigned_admin_name: string | null; unread_count: number;
}
export interface MessageRecord extends RowDataPacket {
  id: number; conversation_id: number; message_seq: number; sender_id: number;
  client_message_id: string; content: string; created_at: Date; is_new?: number;
  sender_name?: string; sender_avatar_url?: string | null;
}
export const getConversation = async (actor: number, id: number, connection?: PoolConnection) => {
  const [rows] = await executeProcedure<ConversationRecord[]>(connection ?? pool, 'sp_chat_get_conversation', [actor, id]);
  if (!rows[0]) throw new Error('Chat conversation result missing');
  return rows[0];
};
export const listConversations = async (actor: number, query: ChatListQuery) => {
  // This procedure returns TWO row sets; executeProcedure only unwraps the first.
  const [sets] = await pool.query<RowDataPacket[][]>('CALL sp_chat_list_conversations(?, ?, ?, ?)',
    [actor, query.status ?? null, query.limit, (query.page - 1) * query.limit]);
  return { conversations: sets[0] as ConversationRecord[], total: Number(sets[1]?.[0]?.total ?? 0) };
};
export const listMessages = async (actor: number, id: number, query: ChatMessagesQuery) => {
  const [rows] = await executeProcedure<MessageRecord[]>(pool, 'sp_chat_list_messages', [actor, id, query.beforeSeq ?? null, query.limit]);
  return rows;
};
export const openConversation = async (actor: number, connection: PoolConnection) => {
  const [rows] = await executeProcedure<ConversationRecord[]>(connection, 'sp_chat_open_conversation', [actor]);
  return rows[0]!;
};
export const sendMessage = async (actor: number, id: number, input: ChatSendInput, connection: PoolConnection) => {
  const [rows] = await executeProcedure<MessageRecord[]>(connection, 'sp_chat_send_message', [actor, id, input.clientMessageId, input.content]);
  return rows[0]!;
};
export const claimConversation = async (actor: number, id: number, connection: PoolConnection) => {
  const [rows] = await executeProcedure<ConversationRecord[]>(connection, 'sp_chat_claim_conversation', [actor, id]);
  return rows[0]!;
};
export const markRead = async (actor: number, id: number, seq: number, connection: PoolConnection) => {
  const [rows] = await executeProcedure<ConversationRecord[]>(connection, 'sp_chat_mark_read', [actor, id, seq]);
  return rows[0]!;
};
export const closeConversation = async (actor: number, id: number, connection: PoolConnection) => {
  const [rows] = await executeProcedure<ConversationRecord[]>(connection, 'sp_chat_close_conversation', [actor, id]);
  return rows[0]!;
};
