import type { PoolConnection } from 'mysql2/promise';
import { withTransaction } from '../config/database';
import * as inventoryRepository from '../repositories/inventory.repository';
import * as productImageRepository from '../repositories/product-image.repository';
import * as productVariantRepository from '../repositories/product-variant.repository';
import * as productRepository from '../repositories/product.repository';
import { AppError } from '../utils/app-error';
import type {
CreateProductInput,
ProductQuery,
UpdateProductInput
} from '../validators/product.validator';
import { makeSlug } from './catalog.service';
import { ensureValidPrices,isDuplicateEntryError,parseJson,toImageResponse,toVariantResponse } from './product.shared';

export const toProductResponse = (product: productRepository.ProductRecord) => ({
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

export const ensureReferences = async (
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

export const listProducts = async (query: ProductQuery, publicOnly = true) => {
  const result = await productRepository.listProducts(query, publicOnly);
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
    productVariantRepository.listVariants(product.id, publicOnly),
    productImageRepository.listImages(product.id),
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
          const variants = await productVariantRepository.listVariants(productId, false, connection);
          if (variants.length > 0) {
            throw new AppError(409, 'Cần xóa hết phiên bản trước khi tắt chế độ phiên bản');
          }
        }
      }

      await productRepository.saveProduct(input, productId, connection);
      const hasVariants = input.hasVariants ?? existing.hasVariants === 1;
      if (hasVariants) await productVariantRepository.syncProductFromVariants(productId, connection);
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
