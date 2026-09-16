import type { RequestHandler } from 'express';

import * as favoriteService from '../services/favorite.service';
import { AppError } from '../utils/app-error';
import { cartIdSchema } from '../validators/cart.validator';

const userIdFrom = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user.id;
};

const productIdFrom = (value: unknown): number => {
  const result = cartIdSchema.safeParse(value);
  if (!result.success) throw new AppError(422, 'ID sản phẩm không hợp lệ');
  return result.data;
};

export const list: RequestHandler = async (req, res) => {
  const data = await favoriteService.listFavorites(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Lấy danh sách yêu thích thành công', data });
};

export const add: RequestHandler = async (req, res) => {
  const favorite = await favoriteService.addFavorite(
    userIdFrom(req),
    productIdFrom(req.params.productId),
  );
  res.status(201).json({ success: true, message: 'Đã thêm vào danh sách yêu thích', data: { favorite } });
};

export const remove: RequestHandler = async (req, res) => {
  await favoriteService.removeFavorite(userIdFrom(req), productIdFrom(req.params.productId));
  res.status(200).json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích', data: null });
};
