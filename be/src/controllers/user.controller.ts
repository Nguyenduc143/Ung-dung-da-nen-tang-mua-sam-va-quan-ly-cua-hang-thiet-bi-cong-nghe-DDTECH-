import type { RequestHandler } from 'express';

import * as userService from '../services/user.service';
import { AppError } from '../utils/app-error';
import {
type ChangePasswordInput,
type UpdateProfileInput
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
