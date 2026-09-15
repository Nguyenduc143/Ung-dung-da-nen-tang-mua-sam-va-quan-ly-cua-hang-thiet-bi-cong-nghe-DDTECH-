import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as promotionService from '../services/promotion.service';
import { AppError } from '../utils/app-error';
import { promotionIdSchema } from '../validators/promotion.validator';
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
  ValidatePromotionInput,
} from '../validators/promotion.validator';

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

export const validate: RequestHandler = async (req, res) => {
  const input = req.body as ValidatePromotionInput;
  const data = await promotionService.validateCartPromotion(requireUser(req.user).id, input.code);
  res.status(200).json({ success: true, message: 'Mã khuyến mãi hợp lệ', data });
};

export const list: RequestHandler = async (_req, res) => {
  const data = await promotionService.listPromotions();
  res.status(200).json({ success: true, message: 'Lấy danh sách khuyến mãi thành công', data });
};

export const create: RequestHandler = async (req, res) => {
  const data = await promotionService.createPromotion(req.body as CreatePromotionInput);
  res.status(201).json({ success: true, message: 'Tạo mã khuyến mãi thành công', data });
};

export const update: RequestHandler = async (req, res) => {
  const data = await promotionService.updatePromotion(
    parse(promotionIdSchema, req.params.id),
    req.body as UpdatePromotionInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật mã khuyến mãi thành công', data });
};

export const remove: RequestHandler = async (req, res) => {
  await promotionService.deletePromotion(parse(promotionIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Ngừng hoạt động mã khuyến mãi thành công', data: null });
};
