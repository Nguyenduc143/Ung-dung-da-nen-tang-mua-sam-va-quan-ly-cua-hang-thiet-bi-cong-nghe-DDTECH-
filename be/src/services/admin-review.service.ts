import type { PoolConnection } from 'mysql2/promise';
import { withTransaction } from '../config/database';
import * as adminReviewRepository from '../repositories/admin-review.repository';
import * as productRepository from '../repositories/product.repository';
import * as reviewRepository from '../repositories/review.repository';
import { AppError } from '../utils/app-error';
import type {
AdminReviewQuery,
ReplyReviewInput,
UpdateReviewStatusInput
} from '../validators/review.validator';
import { pagination,toReviewResponse } from './review.shared';

export const listAdminReviews = async (query: AdminReviewQuery) => {
  const result = await adminReviewRepository.listAdminReviews(query);
  return {
    reviews: result.reviews.map(toReviewResponse),
    pagination: pagination(query.page, query.limit, result.total),
  };
};

export const mutateAdminReview = async (
  reviewId: number,
  operation: (
    current: reviewRepository.ReviewRecord,
    connection: PoolConnection,
  ) => Promise<void>,
  syncRating: boolean,
) => {
  const snapshot = await reviewRepository.findReview(reviewId);
  if (!snapshot) throw new AppError(404, 'Không tìm thấy đánh giá');
  await withTransaction(async (connection) => {
    await productRepository.lockProduct(snapshot.productId, connection);
    const current = await reviewRepository.findReview(reviewId, undefined, connection, true);
    if (!current) throw new AppError(404, 'Không tìm thấy đánh giá');
    await operation(current, connection);
    if (syncRating) await reviewRepository.syncProductRating(current.productId, connection);
  });
  const review = await reviewRepository.findReview(reviewId);
  if (!review) throw new Error('Updated review could not be loaded');
  return toReviewResponse(review);
};

export const updateReviewStatus = async (
  reviewId: number,
  input: UpdateReviewStatusInput,
) => mutateAdminReview(
  reviewId,
  async (review, connection) => {
    await adminReviewRepository.updateStatus(review.id, input.status, connection);
  },
  true,
);

export const replyReview = async (
  reviewId: number,
  input: ReplyReviewInput,
) => mutateAdminReview(
  reviewId,
  async (review, connection) => {
    await adminReviewRepository.replyReview(review.id, input.reply, connection);
  },
  false,
);
