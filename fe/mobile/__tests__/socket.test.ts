const socketHandlers = new Map<string, (payload: unknown) => void>();
const mockSocket = {
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn((event: string, listener: (payload: unknown) => void): void => {
    socketHandlers.set(event, listener);
  }),
  removeAllListeners: jest.fn(),
};
jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: jest.fn(),
}));

import { io } from 'socket.io-client';

import {
  connectRealtime,
  disconnectRealtime,
  subscribeCatalogChanges,
  subscribeRealtime,
} from '@/socket';

const mockIo = jest.mocked(io);

describe('socket realtime manager', () => {
  beforeEach(() => {
    disconnectRealtime();
    socketHandlers.clear();
    mockIo.mockClear();
    mockSocket.connect.mockClear();
    mockSocket.disconnect.mockClear();
    mockSocket.on.mockClear();
    mockSocket.removeAllListeners.mockClear();
    mockSocket.connected = false;
    mockIo.mockReturnValue(mockSocket as never);
  });

  afterEach(() => {
    disconnectRealtime();
    jest.useRealTimers();
  });

  test('không tạo socket thứ hai khi token không đổi', () => {
    connectRealtime('access-token');
    mockSocket.connected = true;
    connectRealtime('access-token');

    expect(mockIo).toHaveBeenCalledTimes(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  test('ngắt socket cũ trước khi đổi token', () => {
    connectRealtime('token-1');
    connectRealtime('token-2');

    expect(mockIo).toHaveBeenCalledTimes(2);
    expect(mockSocket.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  test('unsubscribe loại bỏ listener màn hình', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeRealtime('order:updated', listener);
    connectRealtime('access-token');

    socketHandlers.get('order:updated')?.({ orderId: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    socketHandlers.get('order:updated')?.({ orderId: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('gộp các sự kiện catalog liên tiếp thành một lần refresh', () => {
    jest.useFakeTimers();
    const listener = jest.fn();
    const unsubscribe = subscribeCatalogChanges(listener);
    connectRealtime('access-token');

    socketHandlers.get('product:updated')?.({ productId: 10 });
    socketHandlers.get('product:stock_updated')?.({ productId: 10 });
    jest.advanceTimersByTime(150);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(10);
    unsubscribe();
  });
});
