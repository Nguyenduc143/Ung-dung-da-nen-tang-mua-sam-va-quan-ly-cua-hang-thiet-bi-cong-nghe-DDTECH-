import type { RequestHandler } from 'express';
import * as service from '../services/catalog.service';
import type { CatalogKind } from '../repositories/catalog.repository';
import { idSchema, slugSchema } from '../validators/catalog.validator';
import { AppError } from '../utils/app-error';
import type { ZodType } from 'zod';

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(422, 'Dữ liệu không hợp lệ', result.error.issues);
  return result.data;
}
export const list = (kind: CatalogKind, publicOnly: boolean): RequestHandler => async (req, res) => {
  const data = await service.list(kind, publicOnly, kind === 'category_attributes' ? parse(idSchema, req.params.id) : undefined);
  res.json({ success: true, message: 'Lấy danh sách thành công', data });
};
export const detail = (kind: CatalogKind): RequestHandler => async (req, res) => {
  const data = await service.detail(kind, parse(slugSchema, req.params.slug));
  res.json({ success: true, message: 'Lấy thông tin thành công', data });
};
export const mutate = (kind: CatalogKind, action: 'create' | 'update' | 'delete'): RequestHandler => async (req, res) => {
  const id = action === 'create' ? undefined : parse(idSchema, req.params.id);
  const input = action === 'delete' ? {} : { ...req.body };
  if (kind === 'category_attributes' && action === 'create') input.categoryId = parse(idSchema, req.params.id);
  const data = await service.mutate(kind, input, id, action === 'delete');
  res.status(action === 'create' ? 201 : 200).json({ success: true, message: 'Thao tác thành công', data });
};
