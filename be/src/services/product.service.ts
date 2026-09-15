import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import * as productRepository from '../repositories/product.repository';
import * as inventoryRepository from '../repositories/inventory.repository';
import { AppError } from '../utils/app-error';
import type {
  CreateProductImageInput,
  CreateProductInput,
  CreateVariantInput,
  ProductQuery,
  UpdateProductInput,
  UpdateVariantInput,
} from '../validators/product.validator';
import { makeSlug } from './catalog.service';

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const toProductResponse = (product: productRepository.ProductRecord) => ({
  id: product.id,
  categoryId: product.categoryId,
  brandId: product.brandId,
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  shortDescription: product.shortDescription,
  description: product.description,
  specifications: parseJson(product.specifications),
  price: Number(product.price),
  salePrice: product.salePrice === null ? null : Number(product.salePrice),
  stock: product.stock,
  soldCount: product.soldCount,
  hasVariants: product.hasVariants === 1,
  warrantyMonths: product.warrantyMonths,
  weightGram: product.weightGram,
  ratingAvg: Number(product.ratingAvg),
  reviewCount: product.reviewCount,
  viewCount: product.viewCount,
  isFeatured: product.isFeatured === 1,
  isNew: product.isNew === 1,
  status: product.status,
  primaryImageUrl: product.primaryImageUrl,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const toVariantResponse = (variant: productRepository.VariantRecord) => ({
  id: variant.id,
  productId: variant.productId,
  sku: variant.sku,
  variantName: variant.variantName,
  attributes: parseJson(variant.attributes),
  price: Number(variant.price),
  salePrice: variant.salePrice === null ? null : Number(variant.salePrice),
  stock: variant.stock,
  soldCount: variant.soldCount,
  imageUrl: variant.imageUrl,
  sortOrder: variant.sortOrder,
  status: variant.status,
  createdAt: variant.createdAt,
  updatedAt: variant.updatedAt,
});

const toImageResponse = (image: productRepository.ProductImageRecord) => ({
  id: image.id,
  productId: image.productId,
  variantId: image.variantId,
  imageUrl: image.imageUrl,
  altText: image.altText,
  isPrimary: image.isPrimary === 1,
  sortOrder: image.sortOrder,
  createdAt: image.createdAt,
});

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const ensureValidPrices = (
  price: string | number,
  salePrice: string | number | null | undefined,
): void => {
  if (salePrice !== null && salePrice !== undefined && Number(salePrice) > Number(price)) {
    throw new AppError(422, 'Giá khuyến mãi không được lớn hơn giá gốc');
  }
};

const ensureReferences = async (
  categoryId: number,
  brandId: number | null | undefined,
  connection: PoolConnection,
): Promise<void> => {
  if (!(await productRepository.findCategory(categoryId, connection))) {
    throw new AppError(404, 'Không tìm thấy danh mục');
  }
  if (brandId != null && !(await productRepository.findBrand(brandId, connection))) {
    throw new AppError(404, 'Không tìm thấy thương hiệu');
  }
};

export const listProducts = async (query: ProductQuery) => {
  const result = await productRepository.listPublicProducts(query);
  return {
    products: result.products.map((product) => ({
      ...toProductResponse(product),
      category: {
        id: product.categoryId,
        name: product.categoryName,
        slug: product.categorySlug,
      },
      brand: product.brandId === null
        ? null
        : { id: product.brandId, name: product.brandName, slug: product.brandSlug },
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

export const getProductDetail = async (key: number | string, publicOnly = true) => {
  const product = await productRepository.findProduct(key, publicOnly);
  if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');

  const [variants, images] = await Promise.all([
    productRepository.listVariants(product.id, publicOnly),
    productRepository.listImages(product.id),
  ]);

  return {
    product: toProductResponse(product),
    category: {
      id: product.categoryId,
      name: product.categoryName,
      slug: product.categorySlug,
    },
    brand: product.brandId === null
      ? null
      : { id: product.brandId, name: product.brandName, slug: product.brandSlug },
    specifications: parseJson(product.specifications),
    variants: variants.map(toVariantResponse),
    images: images.map(toImageResponse),
  };
};

export const createProduct = async (adminId: number, input: CreateProductInput) => {
  try {
    const productId = await withTransaction(async (connection) => {
      await ensureReferences(input.categoryId, input.brandId, connection);
      const data: CreateProductInput = {
        ...input,
        slug: input.slug ?? makeSlug(input.name),
        stock: input.hasVariants ? 0 : input.stock,
      };
      const id = await productRepository.saveProduct(data, undefined, connection);
      const initialStock = data.stock ?? 0;
      if (!data.hasVariants && initialStock > 0) {
        await inventoryRepository.createTransaction({
          productId: id,
          variantId: null,
          type: 'IMPORT',
          quantity: initialStock,
          stockAfter: initialStock,
          note: 'Tồn kho ban đầu khi tạo sản phẩm',
          createdBy: adminId,
        }, connection);
      }
      return id;
    });
    return getProductDetail(productId, false);
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AppError(409, 'Slug hoặc SKU sản phẩm đã tồn tại');
    }
    throw error;
  }
};

export const updateProduct = async (productId: number, input: UpdateProductInput) => {
  try {
    await withTransaction(async (connection) => {
      await productRepository.lockProduct(productId, connection);
      const existing = await productRepository.findProduct(productId, false, connection);
      if (!existing) throw new AppError(404, 'Không tìm thấy sản phẩm');

      const categoryId = input.categoryId ?? existing.categoryId;
      const brandId = input.brandId === undefined ? existing.brandId : input.brandId;
      await ensureReferences(categoryId, brandId, connection);
      ensureValidPrices(input.price ?? existing.price, input.salePrice === undefined
        ? existing.salePrice
        : input.salePrice);

      if (input.hasVariants !== undefined && input.hasVariants !== (existing.hasVariants === 1)) {
        if (input.hasVariants && existing.stock > 0) {
          throw new AppError(409, 'Cần điều chỉnh tồn kho sản phẩm về 0 trước khi bật phiên bản');
        }
        if (!input.hasVariants) {
          const variants = await productRepository.listVariants(productId, false, connection);
          if (variants.length > 0) {
            throw new AppError(409, 'Cần xóa hết phiên bản trước khi tắt chế độ phiên bản');
          }
        }
      }

      await productRepository.saveProduct(input, productId, connection);
      const hasVariants = input.hasVariants ?? existing.hasVariants === 1;
      if (hasVariants) await productRepository.syncProductFromVariants(productId, connection);
    });
    return getProductDetail(productId, false);
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AppError(409, 'Slug hoặc SKU sản phẩm đã tồn tại');
    }
    throw error;
  }
};

export const deleteProduct = async (productId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    await productRepository.lockProduct(productId, connection);
    if (!(await productRepository.softDeleteProduct(productId, connection))) {
      throw new AppError(404, 'Không tìm thấy sản phẩm');
    }
  });
};

export const createVariant = async (
  adminId: number,
  productId: number,
  input: CreateVariantInput,
) => {
  try {
    const variantId = await withTransaction(async (connection) => {
      await productRepository.lockProduct(productId, connection);
      const product = await productRepository.findProduct(productId, false, connection);
      if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
      if (product.hasVariants !== 1) {
        throw new AppError(409, 'Sản phẩm chưa được bật chế độ có phiên bản');
      }

      const id = await productRepository.saveVariant(productId, input, undefined, connection);
      const initialStock = input.stock ?? 0;
      if (initialStock > 0) {
        await inventoryRepository.createTransaction({
          productId,
          variantId: id,
          type: 'IMPORT',
          quantity: initialStock,
          stockAfter: initialStock,
          note: 'Tồn kho ban đầu khi tạo phiên bản',
          createdBy: adminId,
        }, connection);
      }
      await productRepository.syncProductFromVariants(productId, connection);
      return id;
    });
    const variant = await productRepository.findVariant(variantId);
    if (!variant) throw new Error('Newly created variant could not be loaded');
    return toVariantResponse(variant);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'SKU phiên bản đã tồn tại');
    throw error;
  }
};

export const updateVariant = async (variantId: number, input: UpdateVariantInput) => {
  try {
    const productId = await withTransaction(async (connection) => {
      const existing = await productRepository.findVariant(variantId, connection);
      if (!existing) throw new AppError(404, 'Không tìm thấy phiên bản sản phẩm');
      await productRepository.lockProduct(existing.productId, connection);
      const product = await productRepository.findProduct(existing.productId, false, connection);
      if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm của phiên bản');

      ensureValidPrices(input.price ?? existing.price, input.salePrice === undefined
        ? existing.salePrice
        : input.salePrice);
      await productRepository.saveVariant(existing.productId, input, variantId, connection);
      if (product.hasVariants === 1) {
        await productRepository.syncProductFromVariants(existing.productId, connection);
      }
      return existing.productId;
    });
    const variant = await productRepository.findVariant(variantId);
    if (!variant || variant.productId !== productId) {
      throw new Error('Updated variant could not be loaded');
    }
    return toVariantResponse(variant);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'SKU phiên bản đã tồn tại');
    throw error;
  }
};

export const deleteVariant = async (variantId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    const variant = await productRepository.findVariant(variantId, connection);
    if (!variant) throw new AppError(404, 'Không tìm thấy phiên bản sản phẩm');
    await productRepository.lockProduct(variant.productId, connection);
    const product = await productRepository.findProduct(variant.productId, false, connection);
    if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm của phiên bản');
    if (variant.stock > 0) {
      throw new AppError(409, 'Cần điều chỉnh tồn kho phiên bản về 0 trước khi xóa');
    }
    if (await productRepository.variantHasOrderHistory(variantId, connection)) {
      throw new AppError(409, 'Không thể xóa phiên bản đã có trong lịch sử đơn hàng');
    }
    if (!(await productRepository.deleteVariant(variant.productId, variantId, connection))) {
      throw new AppError(404, 'Không tìm thấy phiên bản sản phẩm');
    }
    if (product.hasVariants === 1) {
      await productRepository.syncProductFromVariants(variant.productId, connection);
    }
  });
};

export const createProductImage = async (
  productId: number,
  input: CreateProductImageInput,
) => {
  const imageId = await withTransaction(async (connection) => {
    await productRepository.lockProduct(productId, connection);
    const product = await productRepository.findProduct(productId, false, connection);
    if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');

    if (input.variantId != null) {
      const variant = await productRepository.findVariant(input.variantId, connection);
      if (!variant || variant.productId !== productId) {
        throw new AppError(422, 'Phiên bản không thuộc sản phẩm này');
      }
    }

    await productRepository.lockImages(productId, connection);
    const images = await productRepository.listImages(productId, connection);
    const isPrimary = input.isPrimary === true || images.length === 0;
    if (isPrimary) await productRepository.clearPrimaryImage(productId, connection);
    return productRepository.createImage(productId, input, isPrimary, connection);
  });
  const image = await productRepository.findImage(imageId);
  if (!image) throw new Error('Newly created product image could not be loaded');
  return toImageResponse(image);
};

export const deleteProductImage = async (imageId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    const image = await productRepository.findImage(imageId, connection);
    if (!image) throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    await productRepository.lockProduct(image.productId, connection);
    await productRepository.lockImages(image.productId, connection);
    if (!(await productRepository.deleteImage(image.productId, imageId, connection))) {
      throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    }

    if (image.isPrimary === 1) {
      const replacementId = await productRepository.findFirstImageId(image.productId, connection);
      if (replacementId !== null) {
        await productRepository.setPrimaryImage(image.productId, replacementId, connection);
      }
    }
  });
};

export const setPrimaryProductImage = async (imageId: number) => {
  const productId = await withTransaction(async (connection) => {
    const image = await productRepository.findImage(imageId, connection);
    if (!image) throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    await productRepository.lockProduct(image.productId, connection);
    const product = await productRepository.findProduct(image.productId, false, connection);
    if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm của ảnh');
    await productRepository.lockImages(image.productId, connection);
    await productRepository.clearPrimaryImage(image.productId, connection);
    if (!(await productRepository.setPrimaryImage(image.productId, imageId, connection))) {
      throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    }
    return image.productId;
  });
  const image = await productRepository.findImage(imageId);
  if (!image || image.productId !== productId) throw new Error('Primary image could not be loaded');
  return toImageResponse(image);
};
