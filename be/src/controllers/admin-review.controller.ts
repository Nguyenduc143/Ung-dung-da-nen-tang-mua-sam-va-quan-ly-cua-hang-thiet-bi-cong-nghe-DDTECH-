import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import * as adminReviewService from '../services/admin-review.service';

import { AppError } from '../utils/app-error';
import type {
ReplyReviewInput,
UpdateReviewStatusInput
} from '../validators/review.validator';
import {
adminReviewQuerySchema,
reviewIdSchema
} from '../validators/review.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const adminList: RequestHandler = async (req, res) => {
  const data = await adminReviewService.listAdminReviews(parse(adminReviewQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy danh sách đánh giá thành công', data });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const data = await adminReviewService.updateReviewStatus(
    parse(reviewIdSchema, req.params.id),
    req.body as UpdateReviewStatusInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật trạng thái đánh giá thành công', data });
};

export const reply: RequestHandler = async (req, res) => {
  const data = await adminReviewService.replyReview(
    parse(reviewIdSchema, req.params.id),
    req.body as ReplyReviewInput,
  );
  res.status(200).json({ success: true, message: 'Phản hồi đánh giá thành công', data });
};
