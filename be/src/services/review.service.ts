import type { PoolConnection } from 'mysql2/promise';
import { withTransaction } from '../config/database';
import * as productRepository from '../repositories/product.repository';
import * as reviewRepository from '../repositories/review.repository';
import { emitToAdmins } from '../socket';
import { AppError } from '../utils/app-error';
import type {
CreateReviewInput,
ProductReviewQuery,
UpdateReviewInput
} from '../validators/review.validator';
import { pagination,toReviewResponse } from './review.shared';

export const listProductReviews = async (
  productId: number,
  query: ProductReviewQuery,
) => {
  if (!(await productRepository.findProduct(productId, true))) {
    throw new AppError(404, 'Không tìm thấy sản phẩm');
  }
  const result = await reviewRepository.listProductReviews(productId, query);
  return {
    reviews: result.reviews.map(toReviewResponse),
    pagination: pagination(query.page, query.limit, result.total),
  };
};

export const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

export const createReview = async (
  userId: number,
  productId: number,
  input: CreateReviewInput,
) => {
  try {
    const reviewId = await withTransaction(async (connection) => {
      await productRepository.lockProduct(productId, connection);
      const product = await productRepository.findProduct(productId, false, connection);
      if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
      if (product.status !== 'ACTIVE') {
        throw new AppError(409, 'Sản phẩm hiện không khả dụng');
      }
      const orderId = await reviewRepository.findDeliveredPurchase(userId, productId, connection);
      const id = await reviewRepository.createReview(
        userId,
        productId,
        orderId,
        input,
        connection,
      );
      await reviewRepository.syncProductRating(productId, connection);
      return id;
    });
    const review = await reviewRepository.findReview(reviewId, userId);
    if (!review) throw new Error('Newly created review could not be loaded');
    const response = toReviewResponse(review);
    emitToAdmins('review:new', response);
    return response;
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AppError(409, 'Bạn đã đánh giá sản phẩm này');
    }
    throw error;
  }
};

export const mutateOwnedReview = async (
  userId: number,
  reviewId: number,
  operation: (
    current: reviewRepository.ReviewRecord,
    connection: PoolConnection,
  ) => Promise<void>,
): Promise<number> => {
  const snapshot = await reviewRepository.findReview(reviewId, userId);
  if (!snapshot) throw new AppError(404, 'Không tìm thấy đánh giá');
  return withTransaction(async (connection) => {
    await productRepository.lockProduct(snapshot.productId, connection);
    const current = await reviewRepository.findReview(reviewId, userId, connection, true);
    if (!current) throw new AppError(404, 'Không tìm thấy đánh giá');
    await operation(current, connection);
    await reviewRepository.syncProductRating(current.productId, connection);
    return current.productId;
  });
};

export const updateReview = async (
  userId: number,
  reviewId: number,
  input: UpdateReviewInput,
) => {
  await mutateOwnedReview(userId, reviewId, async (review, connection) => {
    await reviewRepository.updateReview(review.id, input, connection);
  });
  const review = await reviewRepository.findReview(reviewId, userId);
  if (!review) throw new Error('Updated review could not be loaded');
  return toReviewResponse(review);
};

export const deleteReview = async (userId: number, reviewId: number): Promise<void> => {
  await mutateOwnedReview(userId, reviewId, async (review, connection) => {
    await reviewRepository.deleteReview(review.id, connection);
  });
};
