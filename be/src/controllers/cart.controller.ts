import type { RequestHandler } from 'express';

import * as cartService from '../services/cart.service';
import { AppError } from '../utils/app-error';

const userIdFrom = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user.id;
};

export const get: RequestHandler = async (req, res) => {
  const data = await cartService.getCart(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Lấy giỏ hàng thành công', data });
};

export const clear: RequestHandler = async (req, res) => {
  const removedCount = await cartService.clearCart(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng', data: { removedCount } });
};
