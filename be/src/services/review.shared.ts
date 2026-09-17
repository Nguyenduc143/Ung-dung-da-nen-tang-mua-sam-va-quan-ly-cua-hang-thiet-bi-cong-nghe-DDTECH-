import * as reviewRepository from '../repositories/review.repository';

export const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export const toReviewResponse = (review: reviewRepository.ReviewRecord) => ({
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

export const pagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
