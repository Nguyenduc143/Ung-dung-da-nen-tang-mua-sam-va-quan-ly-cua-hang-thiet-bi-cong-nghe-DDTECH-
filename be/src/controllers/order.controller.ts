import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as orderService from '../services/order.service';
import { AppError } from '../utils/app-error';
import {
customerOrderQuerySchema,
orderIdSchema,
type CancelOrderInput,
type CheckoutInput
} from '../validators/order.validator';

const requireUser = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user;
};

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const checkout: RequestHandler = async (req, res) => {
  const data = await orderService.checkout(requireUser(req.user).id, req.body as CheckoutInput);
  res.status(201).json({ success: true, message: 'Đặt hàng thành công', data });
};

export const myOrders: RequestHandler = async (req, res) => {
  const data = await orderService.listCustomerOrders(
    requireUser(req.user).id,
    parse(customerOrderQuerySchema, req.query),
  );
  res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng thành công', data });
};

export const customerDetail: RequestHandler = async (req, res) => {
  const data = await orderService.getOrderDetail(
    parse(orderIdSchema, req.params.id),
    requireUser(req.user).id,
  );
  res.status(200).json({ success: true, message: 'Lấy thông tin đơn hàng thành công', data });
};

export const cancel: RequestHandler = async (req, res) => {
  const data = await orderService.cancelCustomerOrder(
    requireUser(req.user).id,
    parse(orderIdSchema, req.params.id),
    req.body as CancelOrderInput,
  );
  res.status(200).json({ success: true, message: 'Hủy đơn hàng thành công', data });
};
