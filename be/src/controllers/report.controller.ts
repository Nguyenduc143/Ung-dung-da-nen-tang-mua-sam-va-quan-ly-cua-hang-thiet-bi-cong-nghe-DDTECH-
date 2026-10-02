import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as reportService from '../services/report.service';
import { AppError } from '../utils/app-error';
import {
  exportReportQuerySchema,
  inventoryReportQuerySchema,
  orderReportQuerySchema,
  productReportQuerySchema,
  revenueReportQuerySchema,
} from '../validators/report.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const revenue: RequestHandler = async (req, res) => {
  const data = await reportService.getRevenue(parse(revenueReportQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy báo cáo doanh thu thành công', data });
};

export const orders: RequestHandler = async (req, res) => {
  const data = await reportService.getOrders(parse(orderReportQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy báo cáo đơn hàng thành công', data });
};

export const products: RequestHandler = async (req, res) => {
  const data = await reportService.getProducts(parse(productReportQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy báo cáo sản phẩm thành công', data });
};

export const inventory: RequestHandler = async (req, res) => {
  const data = await reportService.getInventory(parse(inventoryReportQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy báo cáo tồn kho thành công', data });
};

export const exportFile: RequestHandler = async (req, res) => {
  const file = await reportService.exportReport(parse(exportReportQuerySchema, req.query));
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.setHeader('Content-Length', file.buffer.length);
  res.status(200).send(file.buffer);
};
