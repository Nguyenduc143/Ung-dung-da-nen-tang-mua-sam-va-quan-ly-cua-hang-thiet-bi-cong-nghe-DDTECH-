import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import * as productRepository from '../repositories/product.repository';
import * as reviewRepository from '../repositories/review.repository';
import { emitToAdmins } from '../socket';
import { AppError } from '../utils/app-error';
import type {
  AdminReviewQuery,
  CreateReviewInput,
  ProductReviewQuery,
  ReplyReviewInput,
  UpdateReviewInput,
  UpdateReviewStatusInput,
} from '../validators/review.validator';

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const toReviewResponse = (review: reviewRepository.ReviewRecord) => ({
  id: review.id,
  user: {
    id: review.userId,
    fullName: review.userName,
    avatarUrl: review.userAvatarUrl,
  },
  product: {
    id: review.productId,
    name: review.productName,
  },
  orderId: review.orderId,
  rating: review.rating,
  comment: review.comment,
  images: parseJson(review.images),
  isVerifiedPurchase: review.isVerifiedPurchase === 1,
  adminReply: review.adminReply,
  repliedAt: review.repliedAt,
  status: review.status,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const pagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

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

const isDuplicateEntryError = (error: unknown): boolean =>
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

const mutateOwnedReview = async (
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

export const listAdminReviews = async (query: AdminReviewQuery) => {
  const result = await reviewRepository.listAdminReviews(query);
  return {
    reviews: result.reviews.map(toReviewResponse),
    pagination: pagination(query.page, query.limit, result.total),
  };
};

const mutateAdminReview = async (
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
    await reviewRepository.updateStatus(review.id, input.status, connection);
  },
  true,
);

export const replyReview = async (
  reviewId: number,
  input: ReplyReviewInput,
) => mutateAdminReview(
  reviewId,
  async (review, connection) => {
    await reviewRepository.replyReview(review.id, input.reply, connection);
  },
  false,
);
