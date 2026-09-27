import type { ApiResponse } from '../types/api';
import type { Review, ReviewListData, ReviewQuery, ReviewStatus } from '../types/review';
import { apiClient } from './axiosClient';

export const listReviews = async (query: ReviewQuery): Promise<ReviewListData> => {
  const response = await apiClient.get<ApiResponse<ReviewListData>>('/admin/reviews', {
    params: query,
  });
  return response.data.data;
};

export const updateReviewStatus = async (
  id: number,
  status: ReviewStatus,
): Promise<Review> => {
  const response = await apiClient.patch<ApiResponse<Review>>(
    `/admin/reviews/${id}/status`,
    { status },
  );
  return response.data.data;
};

export const replyReview = async (id: number, reply: string): Promise<Review> => {
  const response = await apiClient.post<ApiResponse<Review>>(`/admin/reviews/${id}/reply`, {
    reply,
  });
  return response.data.data;
};
