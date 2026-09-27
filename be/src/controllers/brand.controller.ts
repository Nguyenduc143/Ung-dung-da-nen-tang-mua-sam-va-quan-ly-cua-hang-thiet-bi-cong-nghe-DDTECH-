import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as catalogService from '../services/catalog.service';
import {
  removeStoredBrandImage,
  removeStoredBrandImageByUrl,
  storeBrandImage,
} from '../services/upload.service';
import * as handlers from '../utils/catalog-handlers';
import { AppError } from '../utils/app-error';
import {
  brandUploadPatch,
  brandUploadSchema,
  idSchema,
} from '../validators/catalog.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

const cleanupBrandImage = async (logoUrl: unknown): Promise<void> => {
  if (typeof logoUrl !== 'string') return;
  await removeStoredBrandImageByUrl(logoUrl).catch((cleanupError: unknown) => {
    console.error('Không thể xóa file logo thương hiệu', cleanupError);
  });
};

const uploadedLogoUrl = (req: Request, filename: string): string => {
  const host = req.get('host');
  if (!host) throw new AppError(400, 'Không xác định được địa chỉ máy chủ');
  return `${req.protocol}://${host}/uploads/brands/${encodeURIComponent(filename)}`;
};

export const list = handlers.list('brands', true);
export const adminList = handlers.list('brands', false);
export const detail = handlers.detail('brands');
export const create = handlers.mutate('brands', 'create');

export const update: RequestHandler = async (req, res) => {
  const id = parse(idSchema, req.params.id);
  const previous = await catalogService.findById('brands', id);
  const brand = await catalogService.mutate('brands', { ...req.body }, id);
  if (previous.logoUrl && previous.logoUrl !== brand?.logoUrl) {
    await cleanupBrandImage(previous.logoUrl);
  }
  res.status(200).json({ success: true, message: 'Thao tác thành công', data: brand });
};

export const remove: RequestHandler = async (req, res) => {
  const id = parse(idSchema, req.params.id);
  const previous = await catalogService.findById('brands', id);
  await catalogService.mutate('brands', {}, id, true);
  await cleanupBrandImage(previous.logoUrl);
  res.status(200).json({ success: true, message: 'Thao tác thành công', data: null });
};

const mutateWithUploadedImage = (
  action: 'create' | 'update',
): RequestHandler => async (req, res) => {
  if (!req.file) throw new AppError(422, 'Vui lòng chọn logo thương hiệu cần tải lên');

  const id = action === 'update' ? parse(idSchema, req.params.id) : undefined;
  const input = parse(action === 'create' ? brandUploadSchema : brandUploadPatch, req.body);
  const previous = id === undefined ? null : await catalogService.findById('brands', id);

  const storedImage = await storeBrandImage(req.file);
  try {
    const brand = await catalogService.mutate('brands', {
      ...input,
      logoUrl: uploadedLogoUrl(req, storedImage.filename),
    }, id);
    if (previous?.logoUrl && previous.logoUrl !== brand?.logoUrl) {
      await cleanupBrandImage(previous.logoUrl);
    }
    res.status(action === 'create' ? 201 : 200).json({
      success: true,
      message: action === 'create'
        ? 'Tạo thương hiệu thành công'
        : 'Cập nhật thương hiệu thành công',
      data: brand,
    });
  } catch (error) {
    await removeStoredBrandImage(storedImage.filename).catch((cleanupError: unknown) => {
      console.error('Không thể dọn file logo thương hiệu sau khi lưu dữ liệu thất bại', cleanupError);
    });
    throw error;
  }
};

export const createUploaded = mutateWithUploadedImage('create');
export const updateUploaded = mutateWithUploadedImage('update');
