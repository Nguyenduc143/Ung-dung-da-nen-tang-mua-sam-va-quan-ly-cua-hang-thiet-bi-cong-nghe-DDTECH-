import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type { NotificationQuery } from '../validators/notification.validator';

export interface NotificationRecord extends RowDataPacket {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'ORDER' | 'PAYMENT' | 'PROMOTION' | 'REVIEW' | 'SYSTEM';
  referenceType: string | null;
  referenceId: number | null;
  isRead: number;
  readAt: Date | null;
  createdAt: Date;
}

interface CountRecord extends RowDataPacket {
  total: number;
}

const NOTIFICATION_COLUMNS = `id, user_id AS userId, title, message, type,
  reference_type AS referenceType, reference_id AS referenceId,
  is_read AS isRead, read_at AS readAt, created_at AS createdAt`;

export const listNotifications = async (userId: number, query: NotificationQuery) => {
  const conditions = ['user_id = ?'];
  const values: Array<number | string> = [userId];
  if (query.unreadOnly === true) conditions.push('is_read = 0');
  if (query.type !== undefined) {
    conditions.push('type = ?');
    values.push(query.type);
  }
  const where = conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [notifications] = await pool.execute<NotificationRecord[]>(
    `SELECT ${NOTIFICATION_COLUMNS} FROM notifications
     WHERE ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...values, query.limit, offset],
  );
  const [countRows] = await pool.execute<CountRecord[]>(
    `SELECT COUNT(*) AS total FROM notifications WHERE ${where}`,
    values,
  );
  return { notifications, total: countRows[0]?.total ?? 0 };
};

export const countUnread = async (userId: number): Promise<number> => {
  const [rows] = await pool.execute<CountRecord[]>(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId],
  );
  return rows[0]?.total ?? 0;
};

export const findOwnedNotification = async (
  notificationId: number,
  userId: number,
  connection?: PoolConnection,
): Promise<NotificationRecord | null> => {
  const executor = connection ?? pool;
  const [rows] = await executor.execute<NotificationRecord[]>(
    `SELECT ${NOTIFICATION_COLUMNS} FROM notifications
     WHERE id = ? AND user_id = ? LIMIT 1${connection ? ' FOR UPDATE' : ''}`,
    [notificationId, userId],
  );
  return rows[0] ?? null;
};

export const markRead = async (
  notificationId: number,
  userId: number,
  connection: PoolConnection,
): Promise<void> => {
  await connection.execute(
    `UPDATE notifications
     SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
  );
};

export const markAllRead = async (userId: number): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND is_read = 0`,
    [userId],
  );
  return result.affectedRows;
};
