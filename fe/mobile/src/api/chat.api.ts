import { apiClient } from './axiosClient';
import type { ApiResponse } from '@/types';
import type { ChatConversation, ChatMessage } from '@/types/chat';

const path = (id: number) => `/chat/conversations/${id}`;
export const openChat = async (): Promise<ChatConversation> =>
  (await apiClient.post<ApiResponse<{ conversation: ChatConversation }>>('/chat/conversations', {})).data.data.conversation;
export const getChat = async (id: number): Promise<ChatConversation> =>
  (await apiClient.get<ApiResponse<{ conversation: ChatConversation }>>(path(id))).data.data.conversation;
export const getChatMessages = async (id: number, beforeSeq?: number) =>
  (await apiClient.get<ApiResponse<{ messages: ChatMessage[]; pagination: { hasMore: boolean; nextBeforeSeq: number | null } }>>(`${path(id)}/messages`, { params: { limit: 50, beforeSeq } })).data.data;
export const sendChatMessage = async (id: number, clientMessageId: string, content: string): Promise<ChatMessage> =>
  (await apiClient.post<ApiResponse<{ message: ChatMessage }>>(`${path(id)}/messages`, { clientMessageId, content })).data.data.message;
export const readChat = async (id: number, readSeq: number): Promise<ChatConversation> =>
  (await apiClient.patch<ApiResponse<{ conversation: ChatConversation }>>(`${path(id)}/read`, { readSeq })).data.data.conversation;
export const getChatUnreadCount = async (): Promise<number> => {
  const data = (await apiClient.get<ApiResponse<{ conversations: ChatConversation[] }>>('/chat/conversations', { params: { status: 'OPEN', limit: 20, page: 1 } })).data.data;
  return data.conversations.reduce((sum, item) => sum + item.unreadCount, 0);
};
