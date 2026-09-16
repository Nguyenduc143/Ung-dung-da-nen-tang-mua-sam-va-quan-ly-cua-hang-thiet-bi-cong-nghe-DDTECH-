import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as productService from '../services/product.service';
import { AppError } from '../utils/app-error';
import {
  productIdSchema,
  productQuerySchema,
  productSlugSchema,
  type CreateProductImageInput,
  type CreateProductInput,
  type CreateVariantInput,
  type UpdateProductInput,
  type UpdateVariantInput,
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

export const detailById: RequestHandler = async (req, res) => {
  const data = await productService.getProductDetail(parse(productIdSchema, req.params.id));
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

export const createVariant: RequestHandler = async (req, res) => {
  const variant = await productService.createVariant(
    req.user!.id,
    parse(productIdSchema, req.params.id),
    req.body as CreateVariantInput,
  );
  res.status(201).json({ success: true, message: 'Tạo phiên bản sản phẩm thành công', data: { variant } });
};

export const updateVariant: RequestHandler = async (req, res) => {
  const variant = await productService.updateVariant(
    parse(productIdSchema, req.params.id),
    req.body as UpdateVariantInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật phiên bản thành công', data: { variant } });
};

export const removeVariant: RequestHandler = async (req, res) => {
  await productService.deleteVariant(parse(productIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Xóa phiên bản thành công', data: null });
};

export const createImage: RequestHandler = async (req, res) => {
  const image = await productService.createProductImage(
    parse(productIdSchema, req.params.id),
    req.body as CreateProductImageInput,
  );
  res.status(201).json({ success: true, message: 'Thêm ảnh sản phẩm thành công', data: { image } });
};

export const removeImage: RequestHandler = async (req, res) => {
  await productService.deleteProductImage(parse(productIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Xóa ảnh sản phẩm thành công', data: null });
};

export const setPrimaryImage: RequestHandler = async (req, res) => {
  const image = await productService.setPrimaryProductImage(
    parse(productIdSchema, req.params.id),
  );
  res.status(200).json({ success: true, message: 'Đặt ảnh chính thành công', data: { image } });
};
