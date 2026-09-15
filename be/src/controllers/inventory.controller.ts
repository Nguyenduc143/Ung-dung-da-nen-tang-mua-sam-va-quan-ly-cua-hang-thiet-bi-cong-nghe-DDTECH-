import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as inventoryService from '../services/inventory.service';
import { AppError } from '../utils/app-error';
import {
  inventoryQuerySchema,
  inventoryTransactionQuerySchema,
  lowStockQuerySchema,
} from '../validators/inventory.validator';
import type {
  AdjustInventoryInput,
  ImportInventoryInput,
} from '../validators/inventory.validator';

const requireUser = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user;
};

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const list: RequestHandler = async (req, res) => {
  const data = await inventoryService.listInventory(parse(inventoryQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy danh sách tồn kho thành công', data });
};

export const transactions: RequestHandler = async (req, res) => {
  const data = await inventoryService.listTransactions(
    parse(inventoryTransactionQuerySchema, req.query),
  );
  res.status(200).json({ success: true, message: 'Lấy lịch sử tồn kho thành công', data });
};

export const lowStock: RequestHandler = async (req, res) => {
  const query = parse(lowStockQuerySchema, req.query);
  const data = await inventoryService.listLowStock(query.threshold);
  res.status(200).json({ success: true, message: 'Lấy danh sách sắp hết hàng thành công', data });
};

export const adjust: RequestHandler = async (req, res) => {
  const data = await inventoryService.adjustInventory(
    requireUser(req.user).id,
    req.body as AdjustInventoryInput,
  );
  res.status(201).json({ success: true, message: 'Điều chỉnh tồn kho thành công', data });
};

export const importStock: RequestHandler = async (req, res) => {
  const data = await inventoryService.importInventory(
    requireUser(req.user).id,
    req.body as ImportInventoryInput,
  );
  res.status(201).json({ success: true, message: 'Nhập kho thành công', data });
};
