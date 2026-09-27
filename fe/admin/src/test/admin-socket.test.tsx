import { App as AntApp } from 'antd';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SocketHandler = (payload: unknown) => void;

const socketTestState = vi.hoisted(() => ({
  handlers: new Map<string, SocketHandler>(),
  socket: {
    connected: false,
    on: vi.fn((event: string, handler: SocketHandler) => {
      socketTestState.handlers.set(event, handler);
    }),
    off: vi.fn((event: string) => {
      socketTestState.handlers.delete(event);
    }),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
  loadHeader: vi.fn().mockResolvedValue(undefined),
  receiveRealtime: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn(),
  setSocketConnected: vi.fn(),
}));

vi.mock('../services/socket', () => ({
  connectAdminSocket: socketTestState.connect,
  disconnectAdminSocket: socketTestState.disconnect,
  getAdminSocket: () => socketTestState.socket,
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { accessToken: string }) => unknown) => (
    selector({ accessToken: 'admin-access-token' })
  ),
}));

vi.mock('../stores/notificationStore', () => ({
  useNotificationStore: (selector: (state: Record<string, unknown>) => unknown) => selector({
    loadHeader: socketTestState.loadHeader,
    receiveRealtime: socketTestState.receiveRealtime,
    reset: socketTestState.reset,
    setSocketConnected: socketTestState.setSocketConnected,
  }),
}));

import { ADMIN_SOCKET_EVENT, useAdminSocket } from '../hooks/useAdminSocket';

const wrapper = ({ children }: PropsWithChildren) => <AntApp>{children}</AntApp>;

describe('admin realtime socket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketTestState.handlers.clear();
  });

  it.each([
    ['order:new', { orderId: 10 }],
    ['product:stock_updated', { productId: 20, stock: 3 }],
  ])('phát sự kiện trình duyệt khi nhận %s', (socketEvent, payload) => {
    const browserListener = vi.fn();
    window.addEventListener(ADMIN_SOCKET_EVENT, browserListener);
    const { unmount } = renderHook(() => useAdminSocket(), { wrapper });

    act(() => {
      socketTestState.handlers.get(socketEvent)?.(payload);
    });

    expect(browserListener).toHaveBeenCalledOnce();
    const event = browserListener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ event: socketEvent, payload });
    expect(socketTestState.connect).toHaveBeenCalledWith('admin-access-token');

    unmount();
    window.removeEventListener(ADMIN_SOCKET_EVENT, browserListener);
  });
});

