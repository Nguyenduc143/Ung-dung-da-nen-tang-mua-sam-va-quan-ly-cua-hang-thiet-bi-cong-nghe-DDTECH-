import type { RequestHandler } from 'express';

import { findActiveUserById } from '../repositories/auth.repository';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/token';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError(401, 'Bạn chưa đăng nhập'));
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token || token.length > 4096) {
    next(new AppError(401, 'Access token không hợp lệ'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await findActiveUserById(Number(payload.sub));
    if (!user) throw new AppError(401, 'Tài khoản không còn hoạt động');
    req.user = {
      id: user.id,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};
