import { withTransaction } from '../config/database';
import * as productImageRepository from '../repositories/product-image.repository';
import * as productVariantRepository from '../repositories/product-variant.repository';
import * as productRepository from '../repositories/product.repository';
import { AppError } from '../utils/app-error';
import type {
CreateProductImageInput
} from '../validators/product.validator';
import { toImageResponse } from './product.shared';

export const createProductImage = async (
  productId: number,
  input: CreateProductImageInput,
) => {
  const imageId = await withTransaction(async (connection) => {
    await productRepository.lockProduct(productId, connection);
    const product = await productRepository.findProduct(productId, false, connection);
    if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');

    if (input.variantId != null) {
      const variant = await productVariantRepository.findVariant(input.variantId, connection);
      if (!variant || variant.productId !== productId) {
        throw new AppError(422, 'Phiên bản không thuộc sản phẩm này');
      }
    }

    await productImageRepository.lockImages(productId, connection);
    const images = await productImageRepository.listImages(productId, connection);
    const isPrimary = input.isPrimary === true || images.length === 0;
    if (isPrimary) await productImageRepository.clearPrimaryImage(productId, connection);
    return productImageRepository.createImage(productId, input, isPrimary, connection);
  });
  const image = await productImageRepository.findImage(imageId);
  if (!image) throw new Error('Newly created product image could not be loaded');
  return toImageResponse(image);
};

export const deleteProductImage = async (imageId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    const image = await productImageRepository.findImage(imageId, connection);
    if (!image) throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    await productRepository.lockProduct(image.productId, connection);
    await productImageRepository.lockImages(image.productId, connection);
    if (!(await productImageRepository.deleteImage(image.productId, imageId, connection))) {
      throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    }

    if (image.isPrimary === 1) {
      const replacementId = await productImageRepository.findFirstImageId(image.productId, connection);
      if (replacementId !== null) {
        await productImageRepository.setPrimaryImage(image.productId, replacementId, connection);
      }
    }
  });
};

export const setPrimaryProductImage = async (imageId: number) => {
  const productId = await withTransaction(async (connection) => {
    const image = await productImageRepository.findImage(imageId, connection);
    if (!image) throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    await productRepository.lockProduct(image.productId, connection);
    const product = await productRepository.findProduct(image.productId, false, connection);
    if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm của ảnh');
    await productImageRepository.lockImages(image.productId, connection);
    await productImageRepository.clearPrimaryImage(image.productId, connection);
    if (!(await productImageRepository.setPrimaryImage(image.productId, imageId, connection))) {
      throw new AppError(404, 'Không tìm thấy ảnh sản phẩm');
    }
    return image.productId;
  });
  const image = await productImageRepository.findImage(imageId);
  if (!image || image.productId !== productId) throw new Error('Primary image could not be loaded');
  return toImageResponse(image);
};
