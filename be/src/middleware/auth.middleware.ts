import type { RequestHandler } from 'express';

import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/token';

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError(401, 'Bạn chưa đăng nhập'));
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    next(new AppError(401, 'Access token không hợp lệ'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};
