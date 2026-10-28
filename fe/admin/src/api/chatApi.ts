import { apiClient } from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { ChatConversation, ChatListData, ChatMessage, ChatMessagesData } from '../types/chat';

const path = (id: number) => `/admin/chat/conversations/${id}`;
export const listConversations = async (page: number, status?: 'OPEN' | 'CLOSED'): Promise<ChatListData> =>
  (await apiClient.get<ApiResponse<ChatListData>>('/admin/chat/conversations', { params: { page, limit: 20, status } })).data.data;
export const getConversation = async (id: number): Promise<ChatConversation> =>
  (await apiClient.get<ApiResponse<{ conversation: ChatConversation }>>(path(id))).data.data.conversation;
export const getMessages = async (id: number, beforeSeq?: number): Promise<ChatMessagesData> =>
  (await apiClient.get<ApiResponse<ChatMessagesData>>(`${path(id)}/messages`, { params: { limit: 50, beforeSeq } })).data.data;
export const sendMessage = async (id: number, clientMessageId: string, content: string): Promise<ChatMessage> =>
  (await apiClient.post<ApiResponse<{ message: ChatMessage; duplicate: boolean }>>(`${path(id)}/messages`, { clientMessageId, content })).data.data.message;
export const claimConversation = async (id: number): Promise<ChatConversation> =>
  (await apiClient.post<ApiResponse<{ conversation: ChatConversation }>>(`${path(id)}/claim`, {})).data.data.conversation;
export const closeConversation = async (id: number): Promise<ChatConversation> =>
  (await apiClient.post<ApiResponse<{ conversation: ChatConversation }>>(`${path(id)}/close`, {})).data.data.conversation;
export const markRead = async (id: number, readSeq: number): Promise<ChatConversation> =>
  (await apiClient.patch<ApiResponse<{ conversation: ChatConversation }>>(`${path(id)}/read`, { readSeq })).data.data.conversation;
