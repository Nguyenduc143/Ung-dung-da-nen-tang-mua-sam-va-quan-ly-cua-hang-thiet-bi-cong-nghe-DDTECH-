import { z } from 'zod';

export const reviewIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const reviewFields = {
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).nullable(),
  images: z.array(z.string().trim().url('URL hình ảnh không hợp lệ').max(500)).max(5).nullable(),
};

export const createReviewSchema = z
  .object({
    rating: reviewFields.rating,
    comment: reviewFields.comment.optional(),
    images: reviewFields.images.optional(),
  })
  .strict();

export const updateReviewSchema = z
  .object({
    rating: reviewFields.rating.optional(),
    comment: reviewFields.comment.optional(),
    images: reviewFields.images.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export const productReviewQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  })
  .strict();

export const adminReviewQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    productId: reviewIdSchema.optional(),
    userId: reviewIdSchema.optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']).optional(),
  })
  .strict();

export const updateReviewStatusSchema = z
  .object({ status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']) })
  .strict();

export const replyReviewSchema = z
  .object({ reply: z.string().trim().min(1).max(5000) })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ProductReviewQuery = z.infer<typeof productReviewQuerySchema>;
export type AdminReviewQuery = z.infer<typeof adminReviewQuerySchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
