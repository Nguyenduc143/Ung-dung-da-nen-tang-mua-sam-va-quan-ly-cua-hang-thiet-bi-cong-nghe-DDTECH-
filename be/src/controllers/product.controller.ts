import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as productService from '../services/product.service';
import { AppError } from '../utils/app-error';
import {
productIdSchema,
productQuerySchema,
productSlugSchema,
type CreateProductInput,
type UpdateProductInput
} from '../validators/product.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const list: RequestHandler = async (req, res) => {
  const data = await productService.listProducts(parse(productQuerySchema, req.query));
  res.status(200).json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data });
};

export const adminList: RequestHandler = async (req, res) => {
  const data = await productService.listProducts(parse(productQuerySchema, req.query), false);
  res.status(200).json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data });
};

export const detailById: RequestHandler = async (req, res) => {
  const data = await productService.getProductDetail(parse(productIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Lấy thông tin sản phẩm thành công', data });
};

export const adminDetailById: RequestHandler = async (req, res) => {
  const data = await productService.getProductDetail(
    parse(productIdSchema, req.params.id),
    false,
  );
  res.status(200).json({ success: true, message: 'Lấy thông tin sản phẩm thành công', data });
};

export const detailBySlug: RequestHandler = async (req, res) => {
  const data = await productService.getProductDetail(parse(productSlugSchema, req.params.slug));
  res.status(200).json({ success: true, message: 'Lấy thông tin sản phẩm thành công', data });
};

export const create: RequestHandler = async (req, res) => {
  const data = await productService.createProduct(
    req.user!.id,
    req.body as CreateProductInput,
  );
  res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data });
};

export const update: RequestHandler = async (req, res) => {
  const data = await productService.updateProduct(
    parse(productIdSchema, req.params.id),
    req.body as UpdateProductInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data });
};

export const remove: RequestHandler = async (req, res) => {
  await productService.deleteProduct(parse(productIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công', data: null });
};
