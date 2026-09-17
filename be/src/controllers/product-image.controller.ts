import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import * as productImageService from '../services/product-image.service';

import { AppError } from '../utils/app-error';
import {
productIdSchema,
type CreateProductImageInput
} from '../validators/product.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const createImage: RequestHandler = async (req, res) => {
  const image = await productImageService.createProductImage(
    parse(productIdSchema, req.params.id),
    req.body as CreateProductImageInput,
  );
  res.status(201).json({ success: true, message: 'Thêm ảnh sản phẩm thành công', data: { image } });
};

export const removeImage: RequestHandler = async (req, res) => {
  await productImageService.deleteProductImage(parse(productIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Xóa ảnh sản phẩm thành công', data: null });
};

export const setPrimaryImage: RequestHandler = async (req, res) => {
  const image = await productImageService.setPrimaryProductImage(
    parse(productIdSchema, req.params.id),
  );
  res.status(200).json({ success: true, message: 'Đặt ảnh chính thành công', data: { image } });
};
