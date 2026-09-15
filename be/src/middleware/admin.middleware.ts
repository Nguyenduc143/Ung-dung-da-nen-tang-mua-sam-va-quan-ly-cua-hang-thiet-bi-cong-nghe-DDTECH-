import type { RequestHandler } from 'express';

import { AppError } from '../utils/app-error';

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new AppError(401, 'Bạn chưa đăng nhập'));
    return;
  }

  if (req.user.role !== 'ADMIN') {
    next(new AppError(403, 'Bạn không có quyền quản trị'));
    return;
  }

  next();
};
