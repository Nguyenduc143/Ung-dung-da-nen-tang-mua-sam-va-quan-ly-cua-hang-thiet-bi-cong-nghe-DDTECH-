import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import * as productImageService from '../services/product-image.service';
import {
  removeStoredProductImage,
  removeStoredProductImageByUrl,
  storeProductImage,
} from '../services/upload.service';

import { AppError } from '../utils/app-error';
import {
productIdSchema,
type CreateProductImageInput,
uploadProductImageSchema,
} from '../validators/product.validator';

const parse = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

export const createImage: RequestHandler = async (req, res) => {
  const image = await productImageService.createProductImage(
    parse(productIdSchema, req.params.id),
    req.body as CreateProductImageInput,
  );
  res.status(201).json({ success: true, message: 'Thêm ảnh sản phẩm thành công', data: { image } });
};

export const createUploadedImage: RequestHandler = async (req, res) => {
  if (!req.file) throw new AppError(422, 'Vui lòng chọn ảnh cần tải lên');

  const productId = parse(productIdSchema, req.params.id);
  const input = parse(uploadProductImageSchema, req.body);
  const storedImage = await storeProductImage(req.file);
  const host = req.get('host');

  if (!host) {
    await removeStoredProductImage(storedImage.filename);
    throw new AppError(400, 'Không xác định được địa chỉ máy chủ');
  }

  const imageUrl = `${req.protocol}://${host}/uploads/products/${encodeURIComponent(storedImage.filename)}`;

  try {
    const image = await productImageService.createProductImage(productId, {
      ...input,
      imageUrl,
    });
    res.status(201).json({
      success: true,
      message: 'Tải ảnh sản phẩm thành công',
      data: {
        image,
        upload: {
          filename: storedImage.filename,
          mimeType: storedImage.mimeType,
          size: storedImage.size,
        },
      },
    });
  } catch (error) {
    await removeStoredProductImage(storedImage.filename).catch((cleanupError: unknown) => {
      console.error('Không thể dọn file ảnh sau khi tạo dữ liệu thất bại', cleanupError);
    });
    throw error;
  }
};

export const removeImage: RequestHandler = async (req, res) => {
  const imageUrl = await productImageService.deleteProductImage(parse(productIdSchema, req.params.id));
  await removeStoredProductImageByUrl(imageUrl).catch((cleanupError: unknown) => {
    console.error('Không thể xóa file ảnh sản phẩm', cleanupError);
  });
  res.status(200).json({ success: true, message: 'Xóa ảnh sản phẩm thành công', data: null });
};

export const setPrimaryImage: RequestHandler = async (req, res) => {
  const image = await productImageService.setPrimaryProductImage(
    parse(productIdSchema, req.params.id),
  );
  res.status(200).json({ success: true, message: 'Đặt ảnh chính thành công', data: { image } });
};
