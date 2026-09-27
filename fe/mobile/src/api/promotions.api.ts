import type { ApiResponse, PromotionValidationData } from '@/types';
import { apiClient } from './axiosClient';

export const validatePromotion = async (
  code: string,
  cartItemIds: number[],
): Promise<PromotionValidationData> => {
  const response = await apiClient.post<ApiResponse<PromotionValidationData>>(
    '/promotions/validate',
    { code, cartItemIds },
  );
  return response.data.data;
};

export const listAvailablePromotions = async (
  cartItemIds: number[],
): Promise<PromotionValidationData[]> => {
  const response = await apiClient.post<ApiResponse<{ promotions: PromotionValidationData[] }>>(
    '/promotions/available',
    { cartItemIds },
  );
  return response.data.data.promotions;
};
