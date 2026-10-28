import { App as AntApp } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { useSupportChat } from '../hooks/useSupportChat';

const state = vi.hoisted(() => ({ value: {} as ReturnType<typeof useSupportChat> }));
vi.mock('../hooks/useSupportChat', () => ({ useSupportChat: () => state.value }));
import { SupportChatPage } from '../pages/SupportChatPage';
const renderPage = () => render(<AntApp><SupportChatPage /></AntApp>);

describe('support chat screen', () => {
  beforeEach(() => {
    const conversation = { id: 1, customerId: 10, customerName: 'Khách Nguyễn', customerAvatarUrl: null,
      assignedAdminId: null, assignedAdminName: null, status: 'OPEN' as const, lastMessageSeq: 0,
      customerReadSeq: 0, adminReadSeq: 0, unreadCount: 1, lastMessageAt: null, closedAt: null,
      createdAt: '2026-10-08T00:00:00Z', updatedAt: '2026-10-08T00:00:00Z' };
    state.value = { user: { id: 99 } as ReturnType<typeof useSupportChat>['user'], status: 'OPEN',
      changeStatus: vi.fn(), page: 1, setPage: vi.fn(), inbox: { conversations: [conversation], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      selectedId: 1, select: vi.fn(), conversation, messages: [], olderSeq: null, loadOlder: vi.fn().mockResolvedValue(undefined),
      loadingList: false, loadingThread: false, loadingOlder: false, busy: false, listError: undefined, threadError: undefined,
      actionError: undefined, connected: true, refresh: vi.fn().mockResolvedValue(undefined), claim: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined), send: vi.fn().mockResolvedValue(undefined), draft: '', setDraft: vi.fn(), markVisibleRead: vi.fn().mockResolvedValue(undefined) };
  });
  it('requires claim before replying', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Nhận phụ trách' }));
    expect(state.value.claim).toHaveBeenCalledOnce();
  });
  it('allows assigned admin to send and escapes HTML in message content', () => {
    state.value.conversation = { ...state.value.conversation!, assignedAdminId: 99, assignedAdminName: 'Bạn' };
    state.value.draft = 'Xin chào';
    state.value.messages = [{ id: 1, conversationId: 1, messageSeq: 1, senderId: 10, clientMessageId: 'm1', content: '<img src=x onerror=alert(1)>', createdAt: '2026-10-08T00:00:00Z' }];
    renderPage();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Gửi' }); expect(send).toBeEnabled();
    fireEvent.click(send); expect(state.value.send).toHaveBeenCalledOnce();
    expect(state.value.markVisibleRead).toHaveBeenCalled();
  });
  it.each(['other', 'closed'])('does not allow replies for %s conversation', condition => {
    state.value.conversation = { ...state.value.conversation!, assignedAdminId: condition === 'other' ? 100 : 99, status: condition === 'closed' ? 'CLOSED' : 'OPEN' };
    state.value.draft = 'Hello'; renderPage();
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Nhận phụ trách' })).not.toBeInTheDocument();
  });
  it('shows a recoverable empty state rather than a broken composer', () => {
    state.value.selectedId = null; state.value.conversation = null; renderPage();
    expect(screen.getByText('Chọn một hội thoại để bắt đầu hỗ trợ')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Nội dung trả lời' })).not.toBeInTheDocument();
  });
});
