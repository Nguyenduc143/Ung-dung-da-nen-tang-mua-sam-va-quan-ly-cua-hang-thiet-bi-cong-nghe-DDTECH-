import { fireEvent, render } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { SupportChatScreen } from '@/screens/chat/SupportChatScreen';
import type { useCustomerChat } from '@/hooks/useCustomerChat';
let mockChat: ReturnType<typeof useCustomerChat>;
jest.mock('@/hooks/useCustomerChat', () => ({ useCustomerChat: () => mockChat }));
jest.mock('@/stores', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: 10 } }) }));
jest.mock('@react-navigation/elements', () => ({ useHeaderHeight: () => 90 }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 20 }) }));

describe('mobile chat screen', () => {
  beforeEach(() => {
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
    mockChat = { conversation: { id: 1, customerId: 10, customerName: 'Khách', assignedAdminId: null, assignedAdminName: null, status: 'OPEN', lastMessageSeq: 0, customerReadSeq: 0, adminReadSeq: 0, unreadCount: 0 },
      messages: [], olderSeq: null, loading: false, loadingOlder: false, sending: false, draft: 'Xin chào', setDraft: jest.fn(), error: null,
      refresh: jest.fn(), retry: jest.fn(), startNew: jest.fn(), send: jest.fn(), loadOlder: jest.fn(), markRead: jest.fn() };
  });
  afterEach(() => jest.restoreAllMocks());
  it('lets a customer send a message without waiting for an admin to claim', () => {
    const view = render(<SupportChatScreen />);
    fireEvent.press(view.getByLabelText('Gửi tin nhắn'));
    expect(mockChat.send).toHaveBeenCalledTimes(1);
    expect(view.getByLabelText('Tin nhắn cho cửa hàng')).toBeTruthy();
  });
  it('offers a new conversation instead of allowing sends after closure', () => {
    mockChat.conversation = { ...mockChat.conversation!, status: 'CLOSED' };
    const view = render(<SupportChatScreen />);
    expect(view.queryByLabelText('Gửi tin nhắn')).toBeNull();
    fireEvent.press(view.getByText('Bắt đầu hội thoại mới'));
    expect(mockChat.startNew).toHaveBeenCalledTimes(1);
  });
  it('shows a retry action on network failure without losing the draft', () => {
    mockChat.error = 'Gửi chưa thành công';
    const view = render(<SupportChatScreen />);
    expect(view.getByDisplayValue('Xin chào')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Thử lại tải chat'));
    expect(mockChat.retry).toHaveBeenCalledTimes(1);
  });
  it('shows the support label instead of the admin account name', () => {
    mockChat.conversation = { ...mockChat.conversation!, assignedAdminId: 99, assignedAdminName: 'DDTECH Admin' };
    mockChat.messages = [{ id: 1, conversationId: 1, messageSeq: 1, senderId: 99, clientMessageId: 'reply', content: 'Xin chào', createdAt: '2026-10-08T00:00:00Z' }];
    const view = render(<SupportChatScreen />);
    expect(view.getByText('Nhân viên chăm sóc khách hàng')).toBeTruthy();
    expect(view.queryByText('DDTECH Admin')).toBeNull();
    expect(view.getByText('Nhân viên chăm sóc khách hàng đang hỗ trợ bạn')).toBeTruthy();
  });
});
