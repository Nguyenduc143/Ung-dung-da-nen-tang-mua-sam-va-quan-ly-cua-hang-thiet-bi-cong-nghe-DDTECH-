import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as adminUserService from '../services/admin-user.service';

import { AppError } from '../utils/app-error';
import {
adminUserQuerySchema,
type UpdateUserStatusInput
} from '../validators/user.validator';

const requireUser = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user;
};

export const listUsers: RequestHandler = async (req, res) => {
  const parsed = adminUserQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(422, 'Tham số truy vấn không hợp lệ', z.flattenError(parsed.error).fieldErrors);
  }
  const data = await adminUserService.listUsers(parsed.data);
  res.status(200).json({ success: true, message: 'Lấy danh sách người dùng thành công', data });
};

export const getUser: RequestHandler = async (req, res) => {
  const user = await adminUserService.getUserById(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Lấy người dùng thành công', data: { user } });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const admin = requireUser(req.user);
  const user = await adminUserService.updateStatus(
    admin.id,
    Number(req.params.id),
    req.body as UpdateUserStatusInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: { user } });
};
