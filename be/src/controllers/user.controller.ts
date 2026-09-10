import type { RequestHandler } from 'express';
import { z } from 'zod';

import * as userService from '../services/user.service';
import { AppError } from '../utils/app-error';
import {
  adminUserQuerySchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
  type UpdateUserStatusInput,
} from '../validators/user.validator';

const requireUser = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user;
};

export const getMe: RequestHandler = async (req, res) => {
  const user = await userService.getProfile(requireUser(req.user).id);
  res.status(200).json({ success: true, message: 'Lấy hồ sơ thành công', data: { user } });
};

export const updateMe: RequestHandler = async (req, res) => {
  const user = await userService.updateProfile(requireUser(req.user).id, req.body as UpdateProfileInput);
  res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công', data: { user } });
};

export const changePassword: RequestHandler = async (req, res) => {
  await userService.changePassword(requireUser(req.user).id, req.body as ChangePasswordInput);
  res.status(200).json({
    success: true,
    message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại',
    data: null,
  });
};

export const listUsers: RequestHandler = async (req, res) => {
  const parsed = adminUserQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(422, 'Tham số truy vấn không hợp lệ', z.flattenError(parsed.error).fieldErrors);
  }
  const data = await userService.listUsers(parsed.data);
  res.status(200).json({ success: true, message: 'Lấy danh sách người dùng thành công', data });
};

export const getUser: RequestHandler = async (req, res) => {
  const user = await userService.getUserById(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Lấy người dùng thành công', data: { user } });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const admin = requireUser(req.user);
  const user = await userService.updateStatus(
    admin.id,
    Number(req.params.id),
    req.body as UpdateUserStatusInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: { user } });
};
