import type {
  ApiResponse,
  AppNotification,
  NotificationListData,
  NotificationListQuery,
} from '@/types';
import { apiClient } from './axiosClient';

export const listNotifications = async (
  query: NotificationListQuery = {},
): Promise<NotificationListData> => {
  const response = await apiClient.get<ApiResponse<NotificationListData>>('/notifications', {
    params: query,
  });
  return response.data.data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
    '/notifications/unread-count',
  );
  return response.data.data.unreadCount;
};

export const markNotificationRead = async (id: number): Promise<AppNotification> => {
  const response = await apiClient.patch<ApiResponse<AppNotification>>(
    `/notifications/${id}/read`,
    {},
  );
  return response.data.data;
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const response = await apiClient.patch<ApiResponse<{ updatedCount: number }>>(
    '/notifications/read-all',
    {},
  );
  return response.data.data.updatedCount;
};
