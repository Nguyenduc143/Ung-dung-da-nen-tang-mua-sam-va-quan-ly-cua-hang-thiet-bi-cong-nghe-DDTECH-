import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import * as adminOrderService from '../services/admin-order.service';

import * as orderService from '../services/order.service';
import { AppError } from '../utils/app-error';
import {
adminOrderQuerySchema,
orderIdSchema,
type UpdateOrderStatusInput
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

export const adminList: RequestHandler = async (req, res) => {
  const data = await adminOrderService.listAdminOrders(parse(adminOrderQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng thành công', data });
};

export const adminDetail: RequestHandler = async (req, res) => {
  const data = await orderService.getOrderDetail(parse(orderIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Lấy thông tin đơn hàng thành công', data });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const data = await adminOrderService.updateOrderStatus(
    requireUser(req.user).id,
    parse(orderIdSchema, req.params.id),
    req.body as UpdateOrderStatusInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data });
};
