import type { ApiResponse, ProductReviewData } from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

export const listProductReviews = async (
  productId: number,
  page = 1,
  limit = 3,
): Promise<ProductReviewData> => {
  const response = await apiClient.get<ApiResponse<ProductReviewData>>(
    `/products/${productId}/reviews`,
    { params: { page, limit } },
  );

  return {
    ...response.data.data,
    reviews: response.data.data.reviews.map((review) => ({
      ...review,
      user: {
        ...review.user,
        avatarUrl: resolveMediaUrl(review.user.avatarUrl),
      },
      images: review.images?.map((imageUrl) => resolveMediaUrl(imageUrl) ?? imageUrl) ?? null,
    })),
  };
};
