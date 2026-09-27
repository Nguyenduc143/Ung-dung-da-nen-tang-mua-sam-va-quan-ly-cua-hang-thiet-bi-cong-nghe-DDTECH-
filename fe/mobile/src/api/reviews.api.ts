import type {
  ApiResponse,
  CreateReviewInput,
  ProductReview,
  ProductReviewData,
  UpdateReviewInput,
} from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

const normalizeReview = (review: ProductReview): ProductReview => ({
  ...review,
  user: { ...review.user, avatarUrl: resolveMediaUrl(review.user.avatarUrl) },
  images: review.images?.map((imageUrl) => resolveMediaUrl(imageUrl) ?? imageUrl) ?? null,
});

export const listProductReviews = async (
  productId: number,
  page = 1,
  limit = 3,
  rating?: number,
): Promise<ProductReviewData> => {
  const response = await apiClient.get<ApiResponse<ProductReviewData>>(
    `/products/${productId}/reviews`,
    { params: { page, limit, rating } },
  );

  return {
    ...response.data.data,
    reviews: response.data.data.reviews.map(normalizeReview),
  };
};

export const createReview = async (
  productId: number,
  input: CreateReviewInput,
): Promise<ProductReview> => {
  const response = await apiClient.post<ApiResponse<ProductReview>>(
    `/products/${productId}/reviews`,
    input,
  );
  return normalizeReview(response.data.data);
};

export const updateReview = async (
  reviewId: number,
  input: UpdateReviewInput,
): Promise<ProductReview> => {
  const response = await apiClient.patch<ApiResponse<ProductReview>>(`/reviews/${reviewId}`, input);
  return normalizeReview(response.data.data);
};

export const deleteReview = async (reviewId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/reviews/${reviewId}`);
};
