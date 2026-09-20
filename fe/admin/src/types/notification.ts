export type NotificationType = 'ORDER' | 'PAYMENT' | 'PROMOTION' | 'REVIEW' | 'SYSTEM';

export interface AdminNotification {
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
  notifications: AdminNotification[];
  pagination: NotificationPagination;
}

export interface NotificationQuery {
  page: number;
  limit: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface UnreadCountData {
  unreadCount: number;
}

export interface ReadAllData {
  updatedCount: number;
}

export interface RealtimeNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  referenceType: string | null;
  referenceId: number | null;
}

export type AdminSocketEvent =
  | 'order:new'
  | 'order:cancelled'
  | 'review:new'
  | 'notification:new'
  | 'product:updated'
  | 'product:stock_updated'
  | 'promotion:updated';
