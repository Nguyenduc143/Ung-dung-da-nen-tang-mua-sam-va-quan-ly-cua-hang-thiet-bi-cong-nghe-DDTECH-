import { withTransaction } from '../config/database';
import * as notificationRepository from '../repositories/notification.repository';
import { AppError } from '../utils/app-error';
import type { NotificationQuery } from '../validators/notification.validator';

const toNotificationResponse = (notification: notificationRepository.NotificationRecord) => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  referenceType: notification.referenceType,
  referenceId: notification.referenceId,
  isRead: notification.isRead === 1,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

export const listNotifications = async (userId: number, query: NotificationQuery) => {
  const result = await notificationRepository.listNotifications(userId, query);
  return {
    notifications: result.notifications.map(toNotificationResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

export const getUnreadCount = async (userId: number) => ({
  unreadCount: await notificationRepository.countUnread(userId),
});

export const readNotification = async (userId: number, notificationId: number) => {
  await withTransaction(async (connection) => {
    const notification = await notificationRepository.findOwnedNotification(
      notificationId,
      userId,
      connection,
    );
    if (!notification) throw new AppError(404, 'Không tìm thấy thông báo');
    if (notification.isRead !== 1) {
      await notificationRepository.markRead(notificationId, userId, connection);
    }
  });
  const notification = await notificationRepository.findOwnedNotification(notificationId, userId);
  if (!notification) throw new Error('Updated notification could not be loaded');
  return toNotificationResponse(notification);
};

export const readAllNotifications = async (userId: number) => ({
  updatedCount: await notificationRepository.markAllRead(userId),
});
