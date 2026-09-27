import type {
  AddCartItemInput,
  ApiResponse,
  CartData,
  UpdateCartItemInput,
} from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

const normalizeCart = (data: CartData): CartData => ({
  ...data,
  items: data.items.map((item) => ({
    ...item,
    imageUrl: resolveMediaUrl(item.imageUrl),
  })),
});

export const addCartItem = async (input: AddCartItemInput): Promise<CartData> => {
  const response = await apiClient.post<ApiResponse<CartData>>('/cart/items', input);
  return normalizeCart(response.data.data);
};

export const getCart = async (): Promise<CartData> => {
  const response = await apiClient.get<ApiResponse<CartData>>('/cart');
  return normalizeCart(response.data.data);
};

export const updateCartItem = async (
  itemId: number,
  input: UpdateCartItemInput,
): Promise<CartData> => {
  const response = await apiClient.patch<ApiResponse<CartData>>(`/cart/items/${itemId}`, input);
  return normalizeCart(response.data.data);
};

export const removeCartItem = async (itemId: number): Promise<void> => {
  await apiClient.delete(`/cart/items/${itemId}`);
};

export const clearCart = async (): Promise<number> => {
  const response = await apiClient.delete<ApiResponse<{ removedCount: number }>>('/cart');
  return response.data.data.removedCount;
};
