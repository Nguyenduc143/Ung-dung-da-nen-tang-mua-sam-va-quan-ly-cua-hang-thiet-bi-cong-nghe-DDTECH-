import type { RequestHandler } from 'express';

import * as cartService from '../services/cart.service';
import { AppError } from '../utils/app-error';
import {
  cartIdSchema,
  type AddCartItemInput,
  type UpdateCartItemInput,
} from '../validators/cart.validator';

const userIdFrom = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user.id;
};

const itemIdFrom = (value: unknown): number => {
  const result = cartIdSchema.safeParse(value);
  if (!result.success) throw new AppError(422, 'ID sản phẩm trong giỏ không hợp lệ');
  return result.data;
};

export const get: RequestHandler = async (req, res) => {
  const data = await cartService.getCart(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Lấy giỏ hàng thành công', data });
};

export const addItem: RequestHandler = async (req, res) => {
  const data = await cartService.addCartItem(userIdFrom(req), req.body as AddCartItemInput);
  res.status(201).json({ success: true, message: 'Thêm sản phẩm vào giỏ hàng thành công', data });
};

export const updateItem: RequestHandler = async (req, res) => {
  const data = await cartService.updateCartItem(
    userIdFrom(req),
    itemIdFrom(req.params.id),
    req.body as UpdateCartItemInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật giỏ hàng thành công', data });
};

export const removeItem: RequestHandler = async (req, res) => {
  await cartService.deleteCartItem(userIdFrom(req), itemIdFrom(req.params.id));
  res.status(200).json({ success: true, message: 'Xóa sản phẩm khỏi giỏ hàng thành công', data: null });
};

export const clear: RequestHandler = async (req, res) => {
  const removedCount = await cartService.clearCart(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng', data: { removedCount } });
};
