import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as notificationService from '../services/notification.service';
import { AppError } from '../utils/app-error';
import {
  notificationIdSchema,
  notificationQuerySchema,
} from '../validators/notification.validator';

const requireUser = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user;
};

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const list: RequestHandler = async (req, res) => {
  const data = await notificationService.listNotifications(
    requireUser(req.user).id,
    parse(notificationQuerySchema, req.query),
  );
  res.status(200).json({ success: true, message: 'Lấy danh sách thông báo thành công', data });
};

export const unreadCount: RequestHandler = async (req, res) => {
  const data = await notificationService.getUnreadCount(requireUser(req.user).id);
  res.status(200).json({ success: true, message: 'Lấy số thông báo chưa đọc thành công', data });
};

export const read: RequestHandler = async (req, res) => {
  const data = await notificationService.readNotification(
    requireUser(req.user).id,
    parse(notificationIdSchema, req.params.id),
  );
  res.status(200).json({ success: true, message: 'Đánh dấu thông báo đã đọc thành công', data });
};

export const readAll: RequestHandler = async (req, res) => {
  const data = await notificationService.readAllNotifications(requireUser(req.user).id);
  res.status(200).json({ success: true, message: 'Đánh dấu tất cả thông báo đã đọc thành công', data });
};
