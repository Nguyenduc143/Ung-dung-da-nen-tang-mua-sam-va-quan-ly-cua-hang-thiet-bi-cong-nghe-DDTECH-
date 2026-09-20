import type { ApiResponse } from '../types/api';
import type {
  OrderDetailData,
  OrderListData,
  OrderQuery,
  UpdateOrderStatusInput,
} from '../types/order';
import { apiClient } from './axiosClient';

export const listOrders = async (query: OrderQuery): Promise<OrderListData> => {
  const response = await apiClient.get<ApiResponse<OrderListData>>('/admin/orders', {
    params: query,
  });
  return response.data.data;
};

export const getOrder = async (id: number): Promise<OrderDetailData> => {
  const response = await apiClient.get<ApiResponse<OrderDetailData>>(`/admin/orders/${id}`);
  return response.data.data;
};

export const updateOrderStatus = async (
  id: number,
  input: UpdateOrderStatusInput,
): Promise<OrderDetailData> => {
  const response = await apiClient.patch<ApiResponse<OrderDetailData>>(
    `/admin/orders/${id}/status`,
    input,
  );
  return response.data.data;
};
