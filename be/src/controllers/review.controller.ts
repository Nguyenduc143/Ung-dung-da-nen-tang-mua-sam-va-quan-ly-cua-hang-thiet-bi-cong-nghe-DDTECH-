import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as reviewService from '../services/review.service';
import { AppError } from '../utils/app-error';
import type {
CreateReviewInput,
UpdateReviewInput
} from '../validators/review.validator';
import {
productReviewQuerySchema,
reviewIdSchema
} from '../validators/review.validator';

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

export const productReviews: RequestHandler = async (req, res) => {
  const data = await reviewService.listProductReviews(
    parse(reviewIdSchema, req.params.productId),
    parse(productReviewQuerySchema, req.query),
  );
  res.status(200).json({ success: true, message: 'Lấy danh sách đánh giá thành công', data });
};

export const create: RequestHandler = async (req, res) => {
  const data = await reviewService.createReview(
    requireUser(req.user).id,
    parse(reviewIdSchema, req.params.productId),
    req.body as CreateReviewInput,
  );
  res.status(201).json({ success: true, message: 'Đánh giá sản phẩm thành công', data });
};

export const update: RequestHandler = async (req, res) => {
  const data = await reviewService.updateReview(
    requireUser(req.user).id,
    parse(reviewIdSchema, req.params.id),
    req.body as UpdateReviewInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật đánh giá thành công', data });
};

export const remove: RequestHandler = async (req, res) => {
  await reviewService.deleteReview(
    requireUser(req.user).id,
    parse(reviewIdSchema, req.params.id),
  );
  res.status(200).json({ success: true, message: 'Xóa đánh giá thành công', data: null });
};
