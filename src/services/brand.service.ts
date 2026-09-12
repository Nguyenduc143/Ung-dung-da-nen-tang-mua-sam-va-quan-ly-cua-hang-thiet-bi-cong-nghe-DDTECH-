import * as brandRepository from '../repositories/brand.repository';
import { AppError } from '../utils/app-error';
import { slugify } from '../utils/slug';
import type { CreateBrandInput, UpdateBrandInput } from '../validators/catalog.validator';

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const toBrandResponse = (brand: brandRepository.BrandRecord) => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  logoUrl: brand.logo_url,
  description: brand.description,
  status: brand.status,
  deletedAt: brand.deleted_at,
  createdAt: brand.created_at,
  updatedAt: brand.updated_at,
});

export const listPublic = async () => (await brandRepository.listPublic()).map(toBrandResponse);

export const getPublicBySlug = async (slug: string) => {
  const brand = await brandRepository.findPublicBySlug(slug);
  if (!brand) throw new AppError(404, 'Không tìm thấy thương hiệu');
  return toBrandResponse(brand);
};

export const listAdmin = async () => (await brandRepository.listAdmin()).map(toBrandResponse);

export const create = async (input: CreateBrandInput) => {
  const slug = input.slug ?? slugify(input.name);
  try {
    const brandId = await brandRepository.create(input, slug);
    const brand = await brandRepository.findById(brandId);
    if (!brand) throw new Error('Newly created brand could not be loaded');
    return toBrandResponse(brand);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Slug thương hiệu đã được sử dụng');
    throw error;
  }
};

export const update = async (brandId: number, input: UpdateBrandInput) => {
  const brand = await brandRepository.findById(brandId);
  if (!brand || brand.deleted_at !== null) throw new AppError(404, 'Không tìm thấy thương hiệu');
  const slug = input.slug ?? (input.name === undefined ? undefined : slugify(input.name));

  try {
    await brandRepository.update(brandId, input, slug);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Slug thương hiệu đã được sử dụng');
    throw error;
  }

  const updated = await brandRepository.findById(brandId);
  if (!updated) throw new AppError(404, 'Không tìm thấy thương hiệu');
  return toBrandResponse(updated);
};

export const remove = async (brandId: number): Promise<void> => {
  if (!(await brandRepository.softDelete(brandId))) {
    throw new AppError(404, 'Không tìm thấy thương hiệu');
  }
};