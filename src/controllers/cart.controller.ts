import type { RequestHandler } from 'express';

import * as cartService from '../services/cart.service';
import { AppError } from '../utils/app-error';
import type { AddCartItemInput, UpdateCartItemInput } from '../validators/cart.validator';

const userIdFrom = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user.id;
};

export const get: RequestHandler = async (req, res) => {
  const cart = await cartService.getCart(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Lấy giỏ hàng thành công', data: { cart } });
};

export const addItem: RequestHandler = async (req, res) => {
  const item = await cartService.addItem(userIdFrom(req), req.body as AddCartItemInput);
  res.status(201).json({ success: true, message: 'Thêm sản phẩm vào giỏ hàng thành công', data: { item } });
};

export const updateItem: RequestHandler = async (req, res) => {
  const item = await cartService.updateItem(
    userIdFrom(req),
    Number(req.params.id),
    req.body as UpdateCartItemInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật giỏ hàng thành công', data: { item } });
};

export const removeItem: RequestHandler = async (req, res) => {
  await cartService.removeItem(userIdFrom(req), Number(req.params.id));
  res.status(200).json({ success: true, message: 'Xóa sản phẩm khỏi giỏ hàng thành công', data: null });
};

export const clear: RequestHandler = async (req, res) => {
  await cartService.clear(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Đã xóa giỏ hàng', data: null });
};