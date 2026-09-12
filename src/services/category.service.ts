import * as categoryRepository from '../repositories/category.repository';
import { AppError } from '../utils/app-error';
import { slugify } from '../utils/slug';
import type {
  CreateCategoryAttributeInput,
  CreateCategoryInput,
  UpdateCategoryAttributeInput,
  UpdateCategoryInput,
} from '../validators/catalog.validator';

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const toCategoryResponse = (category: categoryRepository.CategoryRecord) => ({
  id: category.id,
  parentId: category.parent_id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  imageUrl: category.image_url,
  sortOrder: category.sort_order,
  status: category.status,
  deletedAt: category.deleted_at,
  createdAt: category.created_at,
  updatedAt: category.updated_at,
});

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toAttributeResponse = (attribute: categoryRepository.CategoryAttributeRecord) => ({
  id: attribute.id,
  categoryId: attribute.category_id,
  attrKey: attribute.attr_key,
  attrName: attribute.attr_name,
  unit: attribute.unit,
  inputType: attribute.input_type,
  options: parseJson(attribute.options),
  isFilterable: attribute.is_filterable === 1,
  sortOrder: attribute.sort_order,
  createdAt: attribute.created_at,
  updatedAt: attribute.updated_at,
});

const ensureParentIsValid = async (categoryId: number | null, parentId: number | null) => {
  if (parentId === null) return;

  if (categoryId === parentId) {
    throw new AppError(400, 'Danh mục không thể là parent của chính nó');
  }

  const parent = await categoryRepository.findById(parentId);
  if (!parent || parent.deleted_at !== null) {
    throw new AppError(404, 'Không tìm thấy danh mục cha');
  }

  const visited = new Set<number>();
  let currentId: number | null = parentId;

  while (currentId !== null) {
    if (currentId === categoryId) {
      throw new AppError(400, 'Không thể tạo vòng lặp danh mục');
    }
    if (visited.has(currentId)) {
      throw new AppError(400, 'Cấu trúc danh mục hiện tại đã có vòng lặp');
    }
    visited.add(currentId);

    const current = await categoryRepository.findById(currentId);
    currentId = current?.parent_id ?? null;
  }
};

export const listPublic = async () =>
  (await categoryRepository.listPublic()).map(toCategoryResponse);

export const getPublicBySlug = async (slug: string) => {
  const category = await categoryRepository.findPublicBySlug(slug);
  if (!category) throw new AppError(404, 'Không tìm thấy danh mục');
  return toCategoryResponse(category);
};

export const listAdmin = async () =>
  (await categoryRepository.listAdmin()).map(toCategoryResponse);

export const create = async (input: CreateCategoryInput) => {
  await ensureParentIsValid(null, input.parentId ?? null);
  const slug = input.slug ?? slugify(input.name);

  try {
    const categoryId = await categoryRepository.create(input, slug);
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new Error('Newly created category could not be loaded');
    return toCategoryResponse(category);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Slug danh mục đã được sử dụng');
    throw error;
  }
};

export const update = async (categoryId: number, input: UpdateCategoryInput) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category || category.deleted_at !== null) throw new AppError(404, 'Không tìm thấy danh mục');

  await ensureParentIsValid(categoryId, input.parentId === undefined ? category.parent_id : input.parentId);
  const slug = input.slug ?? (input.name === undefined ? undefined : slugify(input.name));

  try {
    await categoryRepository.update(categoryId, input, slug);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Slug danh mục đã được sử dụng');
    throw error;
  }

  const updated = await categoryRepository.findById(categoryId);
  if (!updated) throw new AppError(404, 'Không tìm thấy danh mục');
  return toCategoryResponse(updated);
};

export const remove = async (categoryId: number): Promise<void> => {
  if (!(await categoryRepository.softDelete(categoryId))) {
    throw new AppError(404, 'Không tìm thấy danh mục');
  }
};

export const listAttributes = async (categoryId: number) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category || category.deleted_at !== null) throw new AppError(404, 'Không tìm thấy danh mục');
  return (await categoryRepository.listAttributes(categoryId)).map(toAttributeResponse);
};

export const createAttribute = async (
  categoryId: number,
  input: CreateCategoryAttributeInput,
) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category || category.deleted_at !== null) throw new AppError(404, 'Không tìm thấy danh mục');

  try {
    const attributeId = await categoryRepository.createAttribute(categoryId, input);
    const attribute = await categoryRepository.findAttributeById(attributeId);
    if (!attribute) throw new Error('Newly created category attribute could not be loaded');
    return toAttributeResponse(attribute);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'attr_key đã tồn tại trong danh mục');
    throw error;
  }
};

const getAttribute = async (attributeId: number) => {
  const attribute = await categoryRepository.findAttributeById(attributeId);
  if (!attribute) throw new AppError(404, 'Không tìm thấy thông số danh mục');
  return attribute;
};

export const updateAttribute = async (
  attributeId: number,
  input: UpdateCategoryAttributeInput,
) => {
  await getAttribute(attributeId);
  try {
    await categoryRepository.updateAttribute(attributeId, input);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'attr_key đã tồn tại trong danh mục');
    throw error;
  }

  const updated = await getAttribute(attributeId);
  return toAttributeResponse(updated);
};

export const removeAttribute = async (attributeId: number): Promise<void> => {
  await getAttribute(attributeId);
  await categoryRepository.deleteAttribute(attributeId);
};