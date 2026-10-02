import type { ApiResponse } from '../types/api';
import type { InventoryTransactionType } from '../types/inventory';
import type { OrderStatus } from '../types/order';
import type {
  InventoryReportData,
  OrderReportData,
  ProductReportData,
  ReportDateQuery,
  ReportExportFile,
  ReportFormat,
  ReportGroupBy,
  ReportKind,
  RevenueReportData,
} from '../types/report';
import { apiClient } from './axiosClient';

export const getRevenue = async (
  query: ReportDateQuery & { groupBy: ReportGroupBy },
): Promise<RevenueReportData> => {
  const response = await apiClient.get<ApiResponse<RevenueReportData>>('/admin/reports/revenue', { params: query });
  return response.data.data;
};

export const getOrders = async (
  query: ReportDateQuery & { page: number; limit: number; status?: OrderStatus },
): Promise<OrderReportData> => {
  const response = await apiClient.get<ApiResponse<OrderReportData>>('/admin/reports/orders', { params: query });
  return response.data.data;
};

export const getProducts = async (
  query: ReportDateQuery & { limit?: number },
): Promise<ProductReportData> => {
  const response = await apiClient.get<ApiResponse<ProductReportData>>('/admin/reports/products', { params: query });
  return response.data.data;
};

export const getInventory = async (
  query: ReportDateQuery & { page: number; limit: number; type?: InventoryTransactionType },
): Promise<InventoryReportData> => {
  const response = await apiClient.get<ApiResponse<InventoryReportData>>('/admin/reports/inventory', { params: query });
  return response.data.data;
};

const fileNameFromHeader = (header: string | undefined, fallback: string): string => {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return header?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
};

export const exportReport = async (
  query: ReportDateQuery & {
    report: ReportKind;
    format: ReportFormat;
    groupBy?: ReportGroupBy;
    status?: OrderStatus;
    type?: InventoryTransactionType;
  },
): Promise<ReportExportFile> => {
  const response = await apiClient.get<Blob>('/admin/reports/export', {
    params: query,
    responseType: 'blob',
  });
  return {
    blob: response.data,
    fileName: fileNameFromHeader(
      response.headers['content-disposition'],
      `ddtech-${query.report}.${query.format}`,
    ),
  };
};
