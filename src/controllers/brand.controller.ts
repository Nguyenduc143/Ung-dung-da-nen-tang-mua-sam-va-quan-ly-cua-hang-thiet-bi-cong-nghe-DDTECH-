import type { RequestHandler } from 'express';

import * as brandService from '../services/brand.service';
import type { CreateBrandInput, UpdateBrandInput } from '../validators/catalog.validator';

export const listPublic: RequestHandler = async (_req, res) => {
  const brands = await brandService.listPublic();
  res.status(200).json({ success: true, message: 'Lấy danh sách thương hiệu thành công', data: { brands } });
};

export const getPublicBySlug: RequestHandler = async (req, res) => {
  const brand = await brandService.getPublicBySlug(String(req.params.slug));
  res.status(200).json({ success: true, message: 'Lấy thương hiệu thành công', data: { brand } });
};

export const listAdmin: RequestHandler = async (_req, res) => {
  const brands = await brandService.listAdmin();
  res.status(200).json({ success: true, message: 'Lấy danh sách thương hiệu thành công', data: { brands } });
};

export const create: RequestHandler = async (req, res) => {
  const brand = await brandService.create(req.body as CreateBrandInput);
  res.status(201).json({ success: true, message: 'Tạo thương hiệu thành công', data: { brand } });
};

export const update: RequestHandler = async (req, res) => {
  const brand = await brandService.update(Number(req.params.id), req.body as UpdateBrandInput);
  res.status(200).json({ success: true, message: 'Cập nhật thương hiệu thành công', data: { brand } });
};

export const remove: RequestHandler = async (req, res) => {
  await brandService.remove(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Ẩn thương hiệu thành công', data: null });
};