import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as paymentService from '../services/payment.service';
import { AppError } from '../utils/app-error';
import { paymentOrderIdSchema } from '../validators/payment.validator';

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

export const create: RequestHandler = async (req, res) => {
  const result = await paymentService.createCodPayment(
    requireUser(req.user).id,
    parse(paymentOrderIdSchema, req.params.orderId),
  );
  res.status(result.created ? 201 : 200).json({
    success: true,
    message: result.created ? 'Tạo thanh toán thành công' : 'Thanh toán đã tồn tại',
    data: { payment: result.payment },
  });
};

export const detail: RequestHandler = async (req, res) => {
  const data = await paymentService.getPayment(
    requireUser(req.user),
    parse(paymentOrderIdSchema, req.params.orderId),
  );
  res.status(200).json({ success: true, message: 'Lấy thông tin thanh toán thành công', data });
};
