import { fireEvent, render } from '@testing-library/react-native';
import { FloatingChatButton } from '@/navigation/FloatingChatButton';
import { chatButtonBottom, chatContentLength, createChatMessageId, mergeChatMessages, showChatButton } from '@/utils/chat';
import { rootNavigationRef, requireLogin } from '@/navigation/authNavigation';
import type { ChatMessage } from '@/types/chat';

jest.mock('@/stores', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ isAuthenticated: false, accessToken: null }) }));
jest.mock('@/api/chat.api', () => ({ getChatUnreadCount: jest.fn() }));
jest.mock('@/socket', () => ({ subscribeRealtime: jest.fn(() => jest.fn()) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }) }));
jest.mock('@/navigation/authNavigation', () => ({ rootNavigationRef: { isReady: () => true, navigate: jest.fn() }, requireLogin: jest.fn() }));

describe('floating customer chat', () => {
  beforeEach(() => jest.clearAllMocks());
  it('opens the protected chat route and requests login for guests', () => {
    const view = render(<FloatingChatButton routeName="HomeTab" />);
    fireEvent.press(view.getByLabelText('Chat với cửa hàng'));
    expect(rootNavigationRef.navigate).toHaveBeenCalledWith('Customer', { screen: 'SupportChat' });
    expect(requireLogin).toHaveBeenCalledTimes(1);
  });
  it.each(['SupportChat', 'Login', 'Register', 'ResetPassword'])('hides on %s', routeName => {
    const view = render(<FloatingChatButton routeName={routeName} />);
    expect(view.queryByLabelText('Chat với cửa hàng')).toBeNull();
  });
  it('stays above tab navigation and respects safe-area padding', () => {
    expect(chatButtonBottom('HomeTab', 34)).toBe(110);
    expect(chatButtonBottom('ProductDetail', 34)).toBe(126);
    expect(showChatButton('CategoriesTab')).toBe(true);
  });
  it('merges duplicate messages newest-first and counts Unicode content', () => {
    const message = (id: number) => ({ id, messageSeq: id }) as ChatMessage;
    expect(mergeChatMessages([message(1), message(2)], [message(2), message(3)]).map(m => m.id)).toEqual([3, 2, 1]);
    expect(chatContentLength(' 👋a ')).toBe(2);
    const key = createChatMessageId(); expect(key).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
  });
});
