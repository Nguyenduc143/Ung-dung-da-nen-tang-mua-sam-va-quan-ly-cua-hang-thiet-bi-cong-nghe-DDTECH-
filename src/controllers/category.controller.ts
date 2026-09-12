import type { RequestHandler } from 'express';

import * as categoryService from '../services/category.service';
import type {
  CreateCategoryAttributeInput,
  CreateCategoryInput,
  UpdateCategoryAttributeInput,
  UpdateCategoryInput,
} from '../validators/catalog.validator';

export const listPublic: RequestHandler = async (_req, res) => {
  const categories = await categoryService.listPublic();
  res.status(200).json({ success: true, message: 'Lấy danh sách danh mục thành công', data: { categories } });
};

export const getPublicBySlug: RequestHandler = async (req, res) => {
  const category = await categoryService.getPublicBySlug(String(req.params.slug));
  res.status(200).json({ success: true, message: 'Lấy danh mục thành công', data: { category } });
};

export const listAdmin: RequestHandler = async (_req, res) => {
  const categories = await categoryService.listAdmin();
  res.status(200).json({ success: true, message: 'Lấy danh sách danh mục thành công', data: { categories } });
};

export const create: RequestHandler = async (req, res) => {
  const category = await categoryService.create(req.body as CreateCategoryInput);
  res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: { category } });
};

export const update: RequestHandler = async (req, res) => {
  const category = await categoryService.update(
    Number(req.params.id),
    req.body as UpdateCategoryInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật danh mục thành công', data: { category } });
};

export const remove: RequestHandler = async (req, res) => {
  await categoryService.remove(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Ẩn danh mục thành công', data: null });
};

export const listAttributes: RequestHandler = async (req, res) => {
  const attributes = await categoryService.listAttributes(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Lấy danh sách thông số thành công', data: { attributes } });
};

export const createAttribute: RequestHandler = async (req, res) => {
  const attribute = await categoryService.createAttribute(
    Number(req.params.id),
    req.body as CreateCategoryAttributeInput,
  );
  res.status(201).json({ success: true, message: 'Tạo thông số thành công', data: { attribute } });
};

export const updateAttribute: RequestHandler = async (req, res) => {
  const attribute = await categoryService.updateAttribute(
    Number(req.params.id),
    req.body as UpdateCategoryAttributeInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật thông số thành công', data: { attribute } });
};

export const removeAttribute: RequestHandler = async (req, res) => {
  await categoryService.removeAttribute(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Xóa thông số thành công', data: null });
};