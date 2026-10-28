import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import * as api from '@/api/chat.api';
import { useCustomerChat } from '@/hooks/useCustomerChat';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback: () => void) => {
  const React = require('react'); React.useEffect(callback, [callback]);
} }));
jest.mock('@/api/chat.api', () => ({ openChat: jest.fn(), getChat: jest.fn(), getChatMessages: jest.fn(), sendChatMessage: jest.fn(), readChat: jest.fn() }));
jest.mock('@/api/axiosClient', () => ({ getApiErrorMessage: (error: Error) => error.message }));
jest.mock('@/socket', () => ({ subscribeRealtime: jest.fn(() => jest.fn()) }));
const mocks = jest.mocked(api);
const detail = { id: 1, customerId: 10, customerName: 'Khách', assignedAdminId: null, assignedAdminName: null, status: 'OPEN' as const, lastMessageSeq: 0, customerReadSeq: 0, adminReadSeq: 0, unreadCount: 0 };
const message = { id: 1, conversationId: 1, messageSeq: 1, senderId: 10, clientMessageId: 'test', content: 'Xin chào', createdAt: '2026-10-08T00:00:00Z' };
describe('customer chat data flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    Object.defineProperty(AppState, 'currentState', { configurable: true, writable: true, value: 'active' });
    mocks.openChat.mockResolvedValue(detail); mocks.getChat.mockResolvedValue(detail);
    mocks.getChatMessages.mockResolvedValue({ messages: [], pagination: { hasMore: false, nextBeforeSeq: null } });
    mocks.readChat.mockResolvedValue(detail);
    // resetAllMocks clears the unsubscribe mock implementation too.
    jest.mocked(require('@/socket').subscribeRealtime).mockImplementation(() => jest.fn());
  });
  it('opens the conversation and keeps failed drafts with the same retry key', async () => {
    const { result } = renderHook(useCustomerChat);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDraft('Xin chào'));
    mocks.sendChatMessage.mockRejectedValueOnce(new Error('Mất mạng')).mockResolvedValueOnce(message);
    await act(async () => { await result.current.send(); });
    expect(result.current.draft).toBe('Xin chào'); expect(result.current.error).toBe('Mất mạng');
    await act(async () => { await result.current.send(); });
    expect(mocks.sendChatMessage.mock.calls[0][1]).toBe(mocks.sendChatMessage.mock.calls[1][1]);
    expect(result.current.draft).toBe(''); expect(result.current.messages).toHaveLength(1);
  });
  it('does not send new messages in a closed conversation', async () => {
    mocks.openChat.mockResolvedValue({ ...detail, status: 'CLOSED' });
    const { result } = renderHook(useCustomerChat);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDraft('Hello'));
    await act(async () => { await result.current.send(); });
    expect(mocks.sendChatMessage).not.toHaveBeenCalled();
  });
  it('does not mark read while the app is in the background', async () => {
    mocks.openChat.mockResolvedValue({ ...detail, lastMessageSeq: 1, unreadCount: 1 });
    const { result } = renderHook(useCustomerChat);
    await waitFor(() => expect(result.current.loading).toBe(false));
    Object.defineProperty(AppState, 'currentState', { value: 'background' });
    await act(async () => { await result.current.markRead(); });
    expect(mocks.readChat).not.toHaveBeenCalled();
  });
  it('recovers the older-message cursor after receiving many offline messages', async () => {
    mocks.getChatMessages.mockResolvedValueOnce({ messages: [message], pagination: { hasMore: false, nextBeforeSeq: null } });
    const { result } = renderHook(useCustomerChat);
    await waitFor(() => expect(result.current.loading).toBe(false));
    mocks.getChat.mockResolvedValue({ ...detail, lastMessageSeq: 100 });
    mocks.getChatMessages.mockResolvedValue({ messages: [{ ...message, id: 100, messageSeq: 100 }], pagination: { hasMore: true, nextBeforeSeq: 100 } });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.messages.map(m => m.id)).toEqual([100]); expect(result.current.olderSeq).toBe(100);
  });
});
