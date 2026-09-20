import { App as AntApp } from 'antd';
import { useEffect } from 'react';

import { connectAdminSocket, disconnectAdminSocket, getAdminSocket } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type {
  AdminSocketEvent,
  NotificationType,
  RealtimeNotificationPayload,
} from '../types/notification';

export const ADMIN_SOCKET_EVENT = 'ddtech:admin-socket-event';

const socketEvents: AdminSocketEvent[] = [
  'order:new',
  'order:cancelled',
  'review:new',
  'notification:new',
  'product:updated',
  'product:stock_updated',
  'promotion:updated',
];

const notificationTypes: NotificationType[] = ['ORDER', 'PAYMENT', 'PROMOTION', 'REVIEW', 'SYSTEM'];

const isRealtimeNotification = (payload: unknown): payload is RealtimeNotificationPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const value = payload as Partial<RealtimeNotificationPayload>;
  return typeof value.title === 'string'
    && typeof value.message === 'string'
    && notificationTypes.includes(value.type as NotificationType);
};

export const useAdminSocket = (): void => {
  const { message } = AntApp.useApp();
  const accessToken = useAuthStore((state) => state.accessToken);
  const loadHeader = useNotificationStore((state) => state.loadHeader);
  const receiveRealtime = useNotificationStore((state) => state.receiveRealtime);
  const reset = useNotificationStore((state) => state.reset);
  const setSocketConnected = useNotificationStore((state) => state.setSocketConnected);

  useEffect(() => {
    if (!accessToken) return;

    reset();
    void loadHeader();
    const socket = getAdminSocket(accessToken);

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleConnectError = () => setSocketConnected(false);
    const handlers = new Map<AdminSocketEvent, (payload: unknown) => void>();

    for (const event of socketEvents) {
      const handler = (payload: unknown) => {
        window.dispatchEvent(new CustomEvent(ADMIN_SOCKET_EVENT, {
          detail: { event, payload },
        }));

        if (event === 'notification:new') {
          void receiveRealtime();
          if (isRealtimeNotification(payload)) {
            message.info({ content: payload.title, key: `notification-${payload.referenceType}-${payload.referenceId}` });
          }
        } else if (event === 'review:new') {
          message.info({ content: 'Có đánh giá sản phẩm mới.', key: 'review-new' });
        }
      };
      handlers.set(event, handler);
      socket.on(event, handler);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    connectAdminSocket(accessToken);

    return () => {
      for (const [event, handler] of handlers) socket.off(event, handler);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      disconnectAdminSocket();
      setSocketConnected(false);
    };
  }, [accessToken, loadHeader, message, receiveRealtime, reset, setSocketConnected]);
};
