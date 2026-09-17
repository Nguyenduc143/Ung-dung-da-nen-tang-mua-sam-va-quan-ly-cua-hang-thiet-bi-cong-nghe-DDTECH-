import type { RequestHandler } from 'express';
import * as sessionService from '../services/session.service';

import { AppError } from '../utils/app-error';
import type {
RefreshTokenInput
} from '../validators/auth.validator';

const getClientMetadata = (req: Parameters<RequestHandler>[0]) => ({
  userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
  ipAddress: req.ip?.slice(0, 45) ?? null,
});

export const refreshToken: RequestHandler = async (req, res) => {
  const { refreshToken: token } = req.body as RefreshTokenInput;
  const data = await sessionService.refreshTokens(token, getClientMetadata(req));
  res.status(200).json({ success: true, message: 'Làm mới token thành công', data });
};

export const logout: RequestHandler = async (req, res) => {
  const { refreshToken: token } = req.body as RefreshTokenInput;
  await sessionService.logout(token);
  res.status(200).json({ success: true, message: 'Đăng xuất thành công', data: null });
};

export const logoutAll: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Bạn chưa đăng nhập');
  }

  const revokedCount = await sessionService.logoutAll(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Đã đăng xuất khỏi tất cả thiết bị',
    data: { revokedCount },
  });
};
