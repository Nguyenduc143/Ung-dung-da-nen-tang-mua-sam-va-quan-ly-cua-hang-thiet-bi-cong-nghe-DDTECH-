import type { ApiResponse } from '../types/api';
import type {
  DashboardLowStock,
  DashboardOrdersByStatus,
  DashboardRecentOrders,
  DashboardRevenue,
  DashboardSummary,
  DashboardTopProducts,
  RevenueQuery,
} from '../types/dashboard';
import { apiClient } from './axiosClient';

export const getSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary');
  return response.data.data;
};

export const getRevenue = async (query: RevenueQuery): Promise<DashboardRevenue> => {
  const response = await apiClient.get<ApiResponse<DashboardRevenue>>('/admin/dashboard/revenue', {
    params: query,
  });
  return response.data.data;
};

export const getOrdersByStatus = async (): Promise<DashboardOrdersByStatus> => {
  const response = await apiClient.get<ApiResponse<DashboardOrdersByStatus>>(
    '/admin/dashboard/orders-by-status',
  );
  return response.data.data;
};

export const getTopProducts = async (limit = 8): Promise<DashboardTopProducts> => {
  const response = await apiClient.get<ApiResponse<DashboardTopProducts>>(
    '/admin/dashboard/top-products',
    { params: { limit } },
  );
  return response.data.data;
};

export const getRecentOrders = async (limit = 8): Promise<DashboardRecentOrders> => {
  const response = await apiClient.get<ApiResponse<DashboardRecentOrders>>(
    '/admin/dashboard/recent-orders',
    { params: { limit } },
  );
  return response.data.data;
};

export const getLowStock = async (threshold = 5): Promise<DashboardLowStock> => {
  const response = await apiClient.get<ApiResponse<DashboardLowStock>>(
    '/admin/dashboard/low-stock',
    { params: { threshold } },
  );
  return response.data.data;
};
