import type {
  ApiResponse,
  CheckoutInput,
  CheckoutResult,
  CustomerOrderListData,
  CustomerOrderQuery,
  OrderDetailData,
  OrderListData,
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

export const getOrderDetail = async (orderId: number): Promise<OrderDetailData> => {
  const response = await apiClient.get<ApiResponse<OrderDetailData>>(`/orders/${orderId}`);
  return response.data.data;
};

export const cancelOrder = async (orderId: number, reason: string): Promise<OrderDetailData> => {
  const response = await apiClient.patch<ApiResponse<OrderDetailData>>(`/orders/${orderId}/cancel`, {
    reason,
  });
  return response.data.data;
};

export const listMyOrders = async (
  query: CustomerOrderQuery = {},
): Promise<CustomerOrderListData> => {
  const response = await apiClient.get<ApiResponse<OrderListData>>('/orders/my-orders', {
    params: query,
  });
  const data = response.data.data;
  const orders = await Promise.all(data.orders.map(async (order) => {
    try {
      const detail = await getOrderDetail(order.id);
      return {
        ...order,
        items: detail.items,
        previewItem: detail.items[0] ?? null,
        itemCount: detail.items.length,
        totalQuantity: detail.items.reduce((total, item) => total + item.quantity, 0),
      };
    } catch {
      return { ...order, items: [], previewItem: null, itemCount: 0, totalQuantity: 0 };
    }
  }));

  return { orders, pagination: data.pagination };
};
