import type { RequestHandler } from 'express';
import { z } from 'zod';

import * as productService from '../services/product.service';
import { AppError } from '../utils/app-error';
import type {
  CreateImageInput,
  CreateProductInput,
  CreateVariantInput,
  ProductQuery,
  UpdateProductInput,
  UpdateVariantInput,
} from '../validators/product.validator';
import { productQuerySchema } from '../validators/product.validator';

export const listPublic: RequestHandler = async (req, res) => {
  const parsed = productQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(422, 'Tham số truy vấn không hợp lệ', z.flattenError(parsed.error).fieldErrors);
  }
  const data = await productService.listPublic(parsed.data as ProductQuery);
  res.status(200).json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data });
};

export const getPublicById: RequestHandler = async (req, res) => {
  const data = await productService.getPublicById(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Lấy chi tiết sản phẩm thành công', data });
};

export const getPublicBySlug: RequestHandler = async (req, res) => {
  const data = await productService.getPublicBySlug(String(req.params.slug));
  res.status(200).json({ success: true, message: 'Lấy chi tiết sản phẩm thành công', data });
};

export const create: RequestHandler = async (req, res) => {
  const product = await productService.create(req.body as CreateProductInput);
  res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: { product } });
};

export const update: RequestHandler = async (req, res) => {
  const product = await productService.update(Number(req.params.id), req.body as UpdateProductInput);
  res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data: { product } });
};

export const remove: RequestHandler = async (req, res) => {
  await productService.remove(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Ẩn sản phẩm thành công', data: null });
};

export const createVariant: RequestHandler = async (req, res) => {
  const variant = await productService.createVariant(
    Number(req.params.id),
    req.body as CreateVariantInput,
  );
  res.status(201).json({ success: true, message: 'Tạo variant thành công', data: { variant } });
};

export const updateVariant: RequestHandler = async (req, res) => {
  const variant = await productService.updateVariant(
    Number(req.params.id),
    req.body as UpdateVariantInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật variant thành công', data: { variant } });
};

export const removeVariant: RequestHandler = async (req, res) => {
  await productService.removeVariant(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Xóa variant thành công', data: null });
};

export const createImage: RequestHandler = async (req, res) => {
  const image = await productService.createImage(Number(req.params.id), req.body as CreateImageInput);
  res.status(201).json({ success: true, message: 'Thêm ảnh sản phẩm thành công', data: { image } });
};

export const removeImage: RequestHandler = async (req, res) => {
  await productService.removeImage(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Xóa ảnh sản phẩm thành công', data: null });
};

export const setPrimaryImage: RequestHandler = async (req, res) => {
  const image = await productService.setPrimaryImage(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Đặt ảnh chính thành công', data: { image } });
};