import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as paymentService from '../services/payment.service';
import { AppError } from '../utils/app-error';
import { normalizeIpAddress, normalizeVnpayQuery } from '../utils/vnpay';
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
  const result = await paymentService.createPayment(
    requireUser(req.user).id,
    parse(paymentOrderIdSchema, req.params.orderId),
    normalizeIpAddress(req.ip),
  );
  res.status(result.created ? 201 : 200).json({
    success: true,
    message: result.created ? 'Tạo thanh toán thành công' : 'Thanh toán đã tồn tại',
    data: result,
  });
};

export const detail: RequestHandler = async (req, res) => {
  const data = await paymentService.getPayment(
    requireUser(req.user),
    parse(paymentOrderIdSchema, req.params.orderId),
  );
  res.status(200).json({ success: true, message: 'Lấy thông tin thanh toán thành công', data });
};

export const vnpayIpn: RequestHandler = async (req, res) => {
  const result = await paymentService.processVnpayIpn(normalizeVnpayQuery(req.query));
  res.status(200).json(result);
};

export const vnpayReturn: RequestHandler = async (req, res) => {
  try {
    const redirectUrl = paymentService.getVnpayReturnRedirect(normalizeVnpayQuery(req.query));
    res.redirect(302, redirectUrl);
  } catch {
    res.status(503).type('html').send(`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>DDTECH - VNPAY</title></head><body>
<h1>Không thể hoàn tất thanh toán</h1><p>Cổng VNPAY chưa được cấu hình đầy đủ.</p>
</body></html>`);
  }
};
