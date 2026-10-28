import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatConversation, ChatMessage } from '../types/chat';

const mocks = vi.hoisted(() => ({
  list: vi.fn(), detail: vi.fn(), history: vi.fn(), send: vi.fn(), claim: vi.fn(), close: vi.fn(), read: vi.fn(),
  handlers: new Map<string, Set<() => void>>(),
}));
vi.mock('../api/chatApi', () => ({ listConversations: mocks.list, getConversation: mocks.detail, getMessages: mocks.history, sendMessage: mocks.send, claimConversation: mocks.claim, closeConversation: mocks.close, markRead: mocks.read }));
vi.mock('../api/axiosClient', () => ({ getApiErrorMessage: (error: Error) => error.message }));
vi.mock('../stores/authStore', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: 99 }, accessToken: 'token' }) }));
vi.mock('../services/socket', () => ({ getAdminSocket: () => ({ connected: true,
  on: (event: string, fn: () => void) => { if (!mocks.handlers.has(event)) mocks.handlers.set(event, new Set()); mocks.handlers.get(event)!.add(fn); },
  off: (event: string, fn: () => void) => mocks.handlers.get(event)?.delete(fn),
}) }));
import { useSupportChat } from '../hooks/useSupportChat';
const conversation = (id = 1): ChatConversation => ({ id, customerId: 10, customerName: 'Khách hàng', customerAvatarUrl: null, assignedAdminId: 99, assignedAdminName: 'Admin', status: 'OPEN', lastMessageSeq: 3, customerReadSeq: 0, adminReadSeq: 0, unreadCount: 2, lastMessageAt: null, closedAt: null, createdAt: '', updatedAt: '' });
const message = (id: number): ChatMessage => ({ id, conversationId: 1, messageSeq: id, senderId: 10, clientMessageId: `m-${id}`, content: `Tin ${id}`, createdAt: '' });
const history = (messages: ChatMessage[], nextBeforeSeq: number | null = null) => ({ messages, pagination: { limit: 50, hasMore: nextBeforeSeq !== null, nextBeforeSeq } });
describe('support chat data flow', () => {
  beforeEach(() => {
    vi.resetAllMocks(); mocks.handlers.clear();
    mocks.list.mockResolvedValue({ conversations: [conversation()], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mocks.detail.mockImplementation(async (id: number) => conversation(id));
    mocks.history.mockResolvedValue(history([message(3), message(2)], 2));
    mocks.claim.mockResolvedValue(conversation()); mocks.close.mockResolvedValue(conversation()); mocks.read.mockResolvedValue(conversation());
  });
  it('preserves a failed draft and reuses the idempotency key for retry', async () => {
    const { result } = renderHook(useSupportChat);
    act(() => result.current.select(1));
    await waitFor(() => expect(result.current.conversation?.id).toBe(1));
    act(() => result.current.setDraft('Xin chào'));
    mocks.send.mockRejectedValueOnce(new Error('Mất mạng')).mockResolvedValueOnce({ ...message(4), senderId: 99 });
    await act(async () => result.current.send());
    expect(result.current.draft).toBe('Xin chào'); expect(result.current.actionError).toBe('Mất mạng');
    await act(async () => result.current.send());
    expect(mocks.send.mock.calls[0][1]).toBe(mocks.send.mock.calls[1][1]);
    expect(result.current.draft).toBe(''); expect(result.current.messages.map(m => m.id)).toEqual([2, 3, 4]);
  });
  it('ignores a late response for a previously selected conversation', async () => {
    let resolve!: (value: ChatConversation) => void;
    mocks.detail.mockImplementation((id: number) => id === 1 ? new Promise<ChatConversation>(r => { resolve = r; }) : Promise.resolve(conversation(id)));
    const { result } = renderHook(useSupportChat);
    act(() => result.current.select(1));
    act(() => result.current.select(2));
    await waitFor(() => expect(result.current.conversation?.id).toBe(2));
    await act(async () => resolve(conversation(1)));
    expect(result.current.conversation?.id).toBe(2);
  });
  it('keeps older loaded rows when realtime refresh returns only recent messages', async () => {
    const { result } = renderHook(useSupportChat);
    act(() => result.current.select(1));
    await waitFor(() => expect(result.current.olderSeq).toBe(2));
    mocks.history.mockResolvedValueOnce(history([message(1)]));
    await act(async () => result.current.loadOlder());
    mocks.history.mockResolvedValue(history([message(4), message(3), message(2)]));
    await act(async () => result.current.refresh());
    expect(result.current.messages.map(m => m.id)).toEqual([1, 2, 3, 4]);
    expect(result.current.olderSeq).toBeNull();
  });
  it('does not mark someone else’s thread read and removes socket listeners on unmount', async () => {
    mocks.detail.mockResolvedValue({ ...conversation(), assignedAdminId: 100 });
    const { result, unmount } = renderHook(useSupportChat);
    act(() => result.current.select(1));
    await waitFor(() => expect(result.current.conversation).not.toBeNull());
    await act(async () => result.current.markVisibleRead());
    expect(mocks.read).not.toHaveBeenCalled();
    unmount(); expect([...mocks.handlers.values()].every(set => set.size === 0)).toBe(true);
  });
  it('keeps separate drafts when switching conversations', () => {
    const { result } = renderHook(useSupportChat);
    act(() => result.current.select(1)); act(() => result.current.setDraft('Khách A'));
    act(() => result.current.select(2)); expect(result.current.draft).toBe('');
    act(() => result.current.setDraft('Khách B')); act(() => result.current.select(1)); expect(result.current.draft).toBe('Khách A');
  });
  it('restores the pagination cursor when offline arrivals leave a history gap', async () => {
    const { result } = renderHook(useSupportChat);
    act(() => result.current.select(1));
    await waitFor(() => expect(result.current.conversation?.id).toBe(1));
    mocks.detail.mockResolvedValue({ ...conversation(), lastMessageSeq: 20 });
    mocks.history.mockResolvedValue(history([message(20), message(19)], 19));
    await act(async () => result.current.refresh());
    expect(result.current.messages.map(m => m.id)).toEqual([19, 20]);
    expect(result.current.olderSeq).toBe(19);
  });
});
