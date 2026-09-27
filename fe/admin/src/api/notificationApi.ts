import type { ApiResponse } from '../types/api';
import type {
  AdminNotification,
  NotificationListData,
  NotificationQuery,
  ReadAllData,
  UnreadCountData,
} from '../types/notification';
import { apiClient } from './axiosClient';

export const listNotifications = async (
  query: NotificationQuery,
): Promise<NotificationListData> => {
  const response = await apiClient.get<ApiResponse<NotificationListData>>('/notifications', {
    params: query,
  });
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<UnreadCountData>>(
    '/notifications/unread-count',
  );
  return response.data.data.unreadCount;
};

export const markNotificationRead = async (id: number): Promise<AdminNotification> => {
  const response = await apiClient.patch<ApiResponse<AdminNotification>>(
    `/notifications/${id}/read`,
    {},
  );
  return response.data.data;
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const response = await apiClient.patch<ApiResponse<ReadAllData>>('/notifications/read-all', {});
  return response.data.data.updatedCount;
};
