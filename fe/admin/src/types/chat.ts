export interface ChatConversation {
  id: number; customerId: number; customerName: string; customerAvatarUrl: string | null;
  assignedAdminId: number | null; assignedAdminName: string | null; status: 'OPEN' | 'CLOSED';
  lastMessageSeq: number; customerReadSeq: number; adminReadSeq: number; unreadCount: number;
  lastMessageAt: string | null; closedAt: string | null; createdAt: string; updatedAt: string;
}
export interface ChatMessage {
  id: number; conversationId: number; messageSeq: number; senderId: number;
  clientMessageId: string; content: string; createdAt: string;
}
export interface ChatListData {
  conversations: ChatConversation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface ChatMessagesData {
  messages: ChatMessage[];
  pagination: { limit: number; hasMore: boolean; nextBeforeSeq: number | null };
}
