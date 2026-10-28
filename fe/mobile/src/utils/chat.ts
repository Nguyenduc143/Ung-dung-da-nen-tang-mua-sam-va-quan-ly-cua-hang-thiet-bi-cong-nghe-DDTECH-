import type { ChatMessage } from '@/types/chat';
export const chatContentLength = (text: string) => Array.from(text.trim()).length;
export const mergeChatMessages = (current: ChatMessage[], incoming: ChatMessage[]) =>
  [...new Map([...current, ...incoming].map(item => [item.id, item])).values()].sort((a, b) => b.messageSeq - a.messageSeq);
// A retry identifier, not a password or authentication token. Works on native RN.
export const createChatMessageId = () => `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export const showChatButton = (route: string) => !['Login', 'Register', 'VerifyRegistration', 'ForgotPassword', 'ResetPassword', 'SupportChat'].includes(route);
export const chatButtonBottom = (route: string, safeBottom: number) => Math.max(safeBottom, 12) +
  (route.endsWith('Tab') || route === 'MainTabs' ? 76 : ['ProductDetail', 'Checkout', 'OrderDetail'].includes(route) ? 92 : 20);
