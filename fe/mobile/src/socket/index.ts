import { io, type Socket } from 'socket.io-client';

import { clearAuthSession } from '@/api/authSession';
import { SOCKET_BASE_URL } from '@/constants';
import { useBadgeStore } from '@/stores/badgeStore';
import type { NotificationType, OrderStatus, PaymentStatus } from '@/types';

export interface OrderRealtimeEvent {
  orderId: number;
  orderCode?: string;
  status?: OrderStatus;
  userId?: number;
  totalAmount?: number;
}

export interface PaymentRealtimeEvent {
  paymentId?: number;
  orderId: number;
  orderCode?: string;
  method?: string;
  status?: PaymentStatus;
}

export interface NotificationRealtimeEvent {
  title: string;
  message: string;
  type: NotificationType;
  referenceType: string | null;
  referenceId: number | null;
}

export interface ProductRealtimeEvent {
  productId: number;
  variantId?: number | null;
  productStock?: number;
  variantStock?: number | null;
}

export interface PromotionRealtimeEvent {
  promotionId?: number;
  productId?: number;
}

export interface AuthSessionRevokedEvent {
  reason: 'logout_all';
}

export interface RealtimeEventMap {
  'order:updated': OrderRealtimeEvent;
  'payment:updated': PaymentRealtimeEvent;
  'payment:created': PaymentRealtimeEvent;
  'notification:new': NotificationRealtimeEvent;
  'product:updated': ProductRealtimeEvent;
  'product:stock_updated': ProductRealtimeEvent;
  'promotion:updated': PromotionRealtimeEvent;
  'auth:session_revoked': AuthSessionRevokedEvent;
}

type RealtimeEventName = keyof RealtimeEventMap;
type RealtimeListener<Event extends RealtimeEventName> = (
  payload: RealtimeEventMap[Event],
) => void;

const subscribers = new Map<RealtimeEventName, Set<(payload: never) => void>>();
let socket: Socket | null = null;
let activeToken: string | null = null;

const publish = <Event extends RealtimeEventName>(
  event: Event,
  payload: RealtimeEventMap[Event],
): void => {
  const listeners = subscribers.get(event);
  listeners?.forEach((listener) => {
    try {
      listener(payload as never);
    } catch (error) {
      console.warn(`Realtime listener ${event} failed`, error);
    }
  });
};

const attachServerListeners = (client: Socket): void => {
  client.on('order:updated', (payload: OrderRealtimeEvent) => {
    publish('order:updated', payload);
  });
  client.on('payment:updated', (payload: PaymentRealtimeEvent) => {
    publish('payment:updated', payload);
  });
  client.on('payment:created', (payload: PaymentRealtimeEvent) => {
    publish('payment:created', payload);
  });
  client.on('notification:new', (payload: NotificationRealtimeEvent) => {
    useBadgeStore.setState((state) => ({
      unreadNotificationCount: state.unreadNotificationCount + 1,
    }));
    publish('notification:new', payload);
  });
  client.on('product:updated', (payload: ProductRealtimeEvent) => {
    publish('product:updated', payload);
  });
  client.on('product:stock_updated', (payload: ProductRealtimeEvent) => {
    publish('product:stock_updated', payload);
  });
  client.on('promotion:updated', (payload: PromotionRealtimeEvent) => {
    publish('promotion:updated', payload);
  });
  client.on('auth:session_revoked', (payload: AuthSessionRevokedEvent) => {
    publish('auth:session_revoked', payload);
    void clearAuthSession('invalid').catch(() => undefined);
  });
};

export const connectRealtime = (accessToken: string): void => {
  const token = accessToken.trim();
  if (!token) return;
  if (socket && activeToken === token) {
    if (!socket.connected) socket.connect();
    return;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  activeToken = token;
  socket = io(SOCKET_BASE_URL, {
    autoConnect: false,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 10_000,
    transports: ['websocket', 'polling'],
  });
  attachServerListeners(socket);
  socket.connect();
};

export const disconnectRealtime = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  activeToken = null;
};

export const subscribeRealtime = <Event extends RealtimeEventName>(
  event: Event,
  listener: RealtimeListener<Event>,
): (() => void) => {
  let listeners = subscribers.get(event);
  if (!listeners) {
    listeners = new Set();
    subscribers.set(event, listeners);
  }
  const storedListener = listener as (payload: never) => void;
  listeners.add(storedListener);
  return () => {
    listeners?.delete(storedListener);
    if (listeners?.size === 0) subscribers.delete(event);
  };
};

export const subscribeCatalogChanges = (
  listener: (productId: number | null) => void,
): (() => void) => {
  const pendingProductIds = new Set<number>();
  let refreshAll = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = (productId: number | null) => {
    if (productId === null) refreshAll = true;
    else pendingProductIds.add(productId);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const changedProductId = !refreshAll && pendingProductIds.size === 1
        ? [...pendingProductIds][0]
        : null;
      pendingProductIds.clear();
      refreshAll = false;
      listener(changedProductId);
    }, 150);
  };
  const unsubscribers = [
    subscribeRealtime('product:updated', (event) => schedule(event.productId)),
    subscribeRealtime('product:stock_updated', (event) => schedule(event.productId)),
    subscribeRealtime('promotion:updated', (event) => schedule(event.productId ?? null)),
  ];
  return () => {
    if (timer) clearTimeout(timer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};
