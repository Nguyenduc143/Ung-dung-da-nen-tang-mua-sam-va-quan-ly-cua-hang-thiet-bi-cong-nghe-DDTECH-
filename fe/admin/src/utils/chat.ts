import type { ChatMessage } from '../types/chat';

export function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  return [...new Map([...existing, ...incoming].map(item => [item.id, item])).values()]
    .sort((a, b) => a.messageSeq - b.messageSeq);
}
export const chatContentLength = (content: string) => Array.from(content.trim()).length;
export function createChatMessageId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // getRandomValues also works on LAN HTTP where randomUUID may be unavailable.
  return `admin-${Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
