import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as dashboardService from '../services/dashboard.service';
import { AppError } from '../utils/app-error';
import {
  dashboardLimitQuerySchema,
  dashboardLowStockQuerySchema,
  emptyDashboardQuerySchema,
  revenueQuerySchema,
} from '../validators/dashboard.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const summary: RequestHandler = async (req, res) => {
  parse(emptyDashboardQuerySchema, req.query);
  const data = await dashboardService.getSummary();
  res.status(200).json({ success: true, message: 'Lấy tổng quan dashboard thành công', data });
};

export const revenue: RequestHandler = async (req, res) => {
  const data = await dashboardService.getRevenue(parse(revenueQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy thống kê doanh thu thành công', data });
};

export const ordersByStatus: RequestHandler = async (req, res) => {
  parse(emptyDashboardQuerySchema, req.query);
  const data = await dashboardService.getOrdersByStatus();
  res.status(200).json({ success: true, message: 'Lấy thống kê trạng thái đơn hàng thành công', data });
};

export const topProducts: RequestHandler = async (req, res) => {
  const query = parse(dashboardLimitQuerySchema, req.query);
  const data = await dashboardService.getTopProducts(query.limit);
  res.status(200).json({ success: true, message: 'Lấy danh sách sản phẩm bán chạy thành công', data });
};

export const recentOrders: RequestHandler = async (req, res) => {
  const query = parse(dashboardLimitQuerySchema, req.query);
  const data = await dashboardService.getRecentOrders(query.limit);
  res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng gần đây thành công', data });
};

export const lowStock: RequestHandler = async (req, res) => {
  const query = parse(dashboardLowStockQuerySchema, req.query);
  const data = await dashboardService.getLowStock(query.threshold);
  res.status(200).json({ success: true, message: 'Lấy danh sách sắp hết hàng thành công', data });
};
