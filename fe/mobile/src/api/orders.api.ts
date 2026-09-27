import type {
  ApiResponse,
  CheckoutInput,
  CheckoutResult,
  ShippingMethod,
} from '@/types';
import { apiClient } from './axiosClient';

export const listShippingMethods = async (): Promise<ShippingMethod[]> => {
  const response = await apiClient.get<ApiResponse<{ shippingMethods: ShippingMethod[] }>>(
    '/orders/shipping-methods',
  );
  return response.data.data.shippingMethods;
};

export const checkout = async (input: CheckoutInput): Promise<CheckoutResult> => {
  const response = await apiClient.post<ApiResponse<CheckoutResult>>('/orders', input);
  return response.data.data;
};
