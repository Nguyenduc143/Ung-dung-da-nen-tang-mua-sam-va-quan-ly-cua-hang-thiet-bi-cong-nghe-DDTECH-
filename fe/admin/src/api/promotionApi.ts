import type { ApiResponse } from '../types/api';
import type { Promotion, PromotionInput, PromotionListData } from '../types/promotion';
import { apiClient } from './axiosClient';

export const listPromotions = async (): Promise<Promotion[]> => {
  const response = await apiClient.get<ApiResponse<PromotionListData>>('/admin/promotions');
  return response.data.data.promotions;
};

export const createPromotion = async (input: PromotionInput): Promise<Promotion> => {
  const response = await apiClient.post<ApiResponse<Promotion>>('/admin/promotions', input);
  return response.data.data;
};

export const updatePromotion = async (
  id: number,
  input: PromotionInput,
): Promise<Promotion> => {
  const response = await apiClient.patch<ApiResponse<Promotion>>(`/admin/promotions/${id}`, input);
  return response.data.data;
};

export const deletePromotion = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/promotions/${id}`);
};
