import type { ApiResponse } from '../types/api';
import type {
  InventoryChangeInput,
  InventoryChangeResult,
  InventoryListData,
  InventoryQuery,
  InventoryTransactionData,
  InventoryTransactionQuery,
  LowStockData,
} from '../types/inventory';
import { apiClient } from './axiosClient';

export const listInventory = async (query: InventoryQuery): Promise<InventoryListData> => {
  const response = await apiClient.get<ApiResponse<InventoryListData>>('/admin/inventory', {
    params: query,
  });
  return response.data.data;
};

export const listTransactions = async (
  query: InventoryTransactionQuery,
): Promise<InventoryTransactionData> => {
  const response = await apiClient.get<ApiResponse<InventoryTransactionData>>(
    '/admin/inventory/transactions',
    { params: query },
  );
  return response.data.data;
};

export const listLowStock = async (threshold = 5): Promise<LowStockData> => {
  const response = await apiClient.get<ApiResponse<LowStockData>>('/admin/inventory/low-stock', {
    params: { threshold },
  });
  return response.data.data;
};

export const adjustStock = async (input: InventoryChangeInput): Promise<InventoryChangeResult> => {
  const response = await apiClient.post<ApiResponse<InventoryChangeResult>>(
    '/admin/inventory/adjust',
    input,
  );
  return response.data.data;
};

export const importStock = async (input: InventoryChangeInput): Promise<InventoryChangeResult> => {
  const response = await apiClient.post<ApiResponse<InventoryChangeResult>>(
    '/admin/inventory/import',
    input,
  );
  return response.data.data;
};
