import { withTransaction } from '../config/database';
import * as inventoryRepository from '../repositories/inventory.repository';
import * as productVariantRepository from '../repositories/product-variant.repository';
import * as productRepository from '../repositories/product.repository';
import { AppError } from '../utils/app-error';
import type {
CreateVariantInput,
UpdateVariantInput
} from '../validators/product.validator';
import { ensureValidPrices,isDuplicateEntryError,toVariantResponse } from './product.shared';

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

      const id = await productVariantRepository.saveVariant(productId, input, undefined, connection);
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
      await productVariantRepository.syncProductFromVariants(productId, connection);
      return id;
    });
    const variant = await productVariantRepository.findVariant(variantId);
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
      const existing = await productVariantRepository.findVariant(variantId, connection);
      if (!existing) throw new AppError(404, 'Không tìm thấy phiên bản sản phẩm');
      await productRepository.lockProduct(existing.productId, connection);
      const product = await productRepository.findProduct(existing.productId, false, connection);
      if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm của phiên bản');

      ensureValidPrices(input.price ?? existing.price, input.salePrice === undefined
        ? existing.salePrice
        : input.salePrice);
      await productVariantRepository.saveVariant(existing.productId, input, variantId, connection);
      if (product.hasVariants === 1) {
        await productVariantRepository.syncProductFromVariants(existing.productId, connection);
      }
      return existing.productId;
    });
    const variant = await productVariantRepository.findVariant(variantId);
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
    const variant = await productVariantRepository.findVariant(variantId, connection);
    if (!variant) throw new AppError(404, 'Không tìm thấy phiên bản sản phẩm');
    await productRepository.lockProduct(variant.productId, connection);
    const product = await productRepository.findProduct(variant.productId, false, connection);
    if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm của phiên bản');
    if (variant.stock > 0) {
      throw new AppError(409, 'Cần điều chỉnh tồn kho phiên bản về 0 trước khi xóa');
    }
    if (await productVariantRepository.variantHasOrderHistory(variantId, connection)) {
      throw new AppError(409, 'Không thể xóa phiên bản đã có trong lịch sử đơn hàng');
    }
    if (!(await productVariantRepository.deleteVariant(variant.productId, variantId, connection))) {
      throw new AppError(404, 'Không tìm thấy phiên bản sản phẩm');
    }
    if (product.hasVariants === 1) {
      await productVariantRepository.syncProductFromVariants(variant.productId, connection);
    }
  });
};
