import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import * as catalogService from '../services/catalog.service';
import {
  removeStoredCategoryImage,
  removeStoredCategoryImageByUrl,
  storeCategoryImage,
} from '../services/upload.service';
import * as handlers from '../utils/catalog-handlers';
import { AppError } from '../utils/app-error';
import {
  categoryUploadPatch,
  categoryUploadSchema,
  idSchema,
} from '../validators/catalog.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

const cleanupCategoryImage = async (imageUrl: unknown): Promise<void> => {
  if (typeof imageUrl !== 'string') return;
  await removeStoredCategoryImageByUrl(imageUrl).catch((cleanupError: unknown) => {
    console.error('Không thể xóa file ảnh danh mục', cleanupError);
  });
};

const uploadedImageUrl = (req: Request, filename: string): string => {
  const host = req.get('host');
  if (!host) throw new AppError(400, 'Không xác định được địa chỉ máy chủ');
  return `${req.protocol}://${host}/uploads/categories/${encodeURIComponent(filename)}`;
};

export const list = handlers.list('categories', true);
export const adminList = handlers.list('categories', false);
export const detail = handlers.detail('categories');
export const create = handlers.mutate('categories', 'create');

export const update: RequestHandler = async (req, res) => {
  const id = parse(idSchema, req.params.id);
  const previous = await catalogService.findById('categories', id);
  const category = await catalogService.mutate('categories', { ...req.body }, id);
  if (previous.imageUrl && previous.imageUrl !== category?.imageUrl) {
    await cleanupCategoryImage(previous.imageUrl);
  }
  res.status(200).json({ success: true, message: 'Thao tác thành công', data: category });
};

export const remove: RequestHandler = async (req, res) => {
  const id = parse(idSchema, req.params.id);
  const previous = await catalogService.findById('categories', id);
  await catalogService.mutate('categories', {}, id, true);
  await cleanupCategoryImage(previous.imageUrl);
  res.status(200).json({ success: true, message: 'Thao tác thành công', data: null });
};

const mutateWithUploadedImage = (
  action: 'create' | 'update',
): RequestHandler => async (req, res) => {
  if (!req.file) throw new AppError(422, 'Vui lòng chọn ảnh danh mục cần tải lên');

  const id = action === 'update' ? parse(idSchema, req.params.id) : undefined;
  const input = parse(action === 'create' ? categoryUploadSchema : categoryUploadPatch, req.body);
  const previous = id === undefined ? null : await catalogService.findById('categories', id);
  const host = req.get('host');
  if (!host) throw new AppError(400, 'Không xác định được địa chỉ máy chủ');

  const storedImage = await storeCategoryImage(req.file);
  try {
    const category = await catalogService.mutate('categories', {
      ...input,
      imageUrl: uploadedImageUrl(req, storedImage.filename),
    }, id);
    if (previous?.imageUrl && previous.imageUrl !== category?.imageUrl) {
      await cleanupCategoryImage(previous.imageUrl);
    }
    res.status(action === 'create' ? 201 : 200).json({
      success: true,
      message: action === 'create' ? 'Tạo danh mục thành công' : 'Cập nhật danh mục thành công',
      data: category,
    });
  } catch (error) {
    await removeStoredCategoryImage(storedImage.filename).catch((cleanupError: unknown) => {
      console.error('Không thể dọn file ảnh danh mục sau khi lưu dữ liệu thất bại', cleanupError);
    });
    throw error;
  }
};

export const createUploaded = mutateWithUploadedImage('create');
export const updateUploaded = mutateWithUploadedImage('update');
