export type NotificationType = 'ORDER' | 'PAYMENT' | 'PROMOTION' | 'REVIEW' | 'SYSTEM';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListData {
  notifications: AppNotification[];
  pagination: NotificationPagination;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}
