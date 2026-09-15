import type { RequestHandler } from 'express';

import * as authService from '../services/auth.service';
import { AppError } from '../utils/app-error';
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
} from '../validators/auth.validator';

const getClientMetadata = (req: Parameters<RequestHandler>[0]) => ({
  userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
  ipAddress: req.ip?.slice(0, 45) ?? null,
});

export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(req.body as RegisterInput);
  res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản thành công',
    data: { user },
  });
};

export const login: RequestHandler = async (req, res) => {
  const data = await authService.login(req.body as LoginInput, getClientMetadata(req));
  res.status(200).json({ success: true, message: 'Đăng nhập thành công', data });
};

export const refreshToken: RequestHandler = async (req, res) => {
  const { refreshToken: token } = req.body as RefreshTokenInput;
  const data = await authService.refreshTokens(token, getClientMetadata(req));
  res.status(200).json({ success: true, message: 'Làm mới token thành công', data });
};

export const logout: RequestHandler = async (req, res) => {
  const { refreshToken: token } = req.body as RefreshTokenInput;
  await authService.logout(token);
  res.status(200).json({ success: true, message: 'Đăng xuất thành công', data: null });
};

export const logoutAll: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Bạn chưa đăng nhập');
  }

  const revokedCount = await authService.logoutAll(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Đã đăng xuất khỏi tất cả thiết bị',
    data: { revokedCount },
  });
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Bạn chưa đăng nhập');
  }

  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, message: 'Lấy thông tin tài khoản thành công', data: { user } });
};
