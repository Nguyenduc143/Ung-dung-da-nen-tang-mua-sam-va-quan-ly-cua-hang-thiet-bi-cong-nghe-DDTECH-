import { create } from 'zustand';

import * as notificationApi from '../api/notificationApi';
import type { AdminNotification } from '../types/notification';

interface NotificationState {
  latest: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
  realtimeRevision: number;
  loadHeader: () => Promise<void>;
  receiveRealtime: () => Promise<void>;
  markRead: (id: number) => Promise<AdminNotification>;
  markAllRead: () => Promise<number>;
  setSocketConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  latest: [],
  unreadCount: 0,
  loading: false,
  error: null,
  socketConnected: false,
  realtimeRevision: 0,

  loadHeader: async () => {
    set({ loading: true, error: null });
    try {
      const [listData, unreadCount] = await Promise.all([
        notificationApi.listNotifications({ page: 1, limit: 5 }),
        notificationApi.getUnreadCount(),
      ]);
      set({ latest: listData.notifications, unreadCount });
    } catch {
      set({ error: 'Không thể tải thông báo.' });
    } finally {
      set({ loading: false });
    }
  },

  receiveRealtime: async () => {
    set((state) => ({ realtimeRevision: state.realtimeRevision + 1 }));
    await get().loadHeader();
  },

  markRead: async (id) => {
    const notification = await notificationApi.markNotificationRead(id);
    await get().loadHeader();
    return notification;
  },

  markAllRead: async () => {
    const updatedCount = await notificationApi.markAllNotificationsRead();
    set((state) => ({
      latest: state.latest.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));
    return updatedCount;
  },

  setSocketConnected: (socketConnected) => set({ socketConnected }),

  reset: () => set({
    latest: [],
    unreadCount: 0,
    loading: false,
    error: null,
    socketConnected: false,
    realtimeRevision: 0,
  }),
}));
