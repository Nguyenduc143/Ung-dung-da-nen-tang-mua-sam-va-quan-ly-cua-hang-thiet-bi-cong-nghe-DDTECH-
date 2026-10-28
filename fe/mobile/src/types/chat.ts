export interface ChatConversation {
  id: number; customerId: number; customerName: string; assignedAdminId: number | null;
  assignedAdminName: string | null; status: 'OPEN' | 'CLOSED'; lastMessageSeq: number;
  customerReadSeq: number; adminReadSeq: number; unreadCount: number;
}
export interface ChatMessage {
  id: number; conversationId: number; messageSeq: number; senderId: number;
  clientMessageId: string; content: string; createdAt: string;
}
export interface ChatRealtimeEvent {
  conversationId: number; customerId: number; assignedAdminId: number | null;
  status: 'OPEN' | 'CLOSED'; lastMessageSeq: number; customerReadSeq: number; adminReadSeq: number;
  message?: ChatMessage;
}
