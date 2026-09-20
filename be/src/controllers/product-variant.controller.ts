import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import * as productVariantService from '../services/product-variant.service';

import { AppError } from '../utils/app-error';
import {
productIdSchema,
type CreateVariantInput,
type UpdateVariantInput
} from '../validators/product.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const createVariant: RequestHandler = async (req, res) => {
  const variant = await productVariantService.createVariant(
    req.user!.id,
    parse(productIdSchema, req.params.id),
    req.body as CreateVariantInput,
  );
  res.status(201).json({ success: true, message: 'Tạo phiên bản sản phẩm thành công', data: { variant } });
};

export const updateVariant: RequestHandler = async (req, res) => {
  const variant = await productVariantService.updateVariant(
    parse(productIdSchema, req.params.id),
    req.body as UpdateVariantInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật phiên bản thành công', data: { variant } });
};

export const removeVariant: RequestHandler = async (req, res) => {
  await productVariantService.deleteVariant(parse(productIdSchema, req.params.id));
  res.status(200).json({ success: true, message: 'Xóa phiên bản thành công', data: null });
};
