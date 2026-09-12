import type { RequestHandler } from 'express';

import * as favoriteService from '../services/favorite.service';
import { AppError } from '../utils/app-error';

const userIdFrom = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user.id;
};

export const list: RequestHandler = async (req, res) => {
  const favorites = await favoriteService.list(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Lấy danh sách yêu thích thành công', data: { favorites } });
};

export const add: RequestHandler = async (req, res) => {
  await favoriteService.add(userIdFrom(req), Number(req.params.productId));
  res.status(201).json({ success: true, message: 'Đã thêm sản phẩm vào yêu thích', data: null });
};

export const remove: RequestHandler = async (req, res) => {
  await favoriteService.remove(userIdFrom(req), Number(req.params.productId));
  res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi yêu thích', data: null });
};