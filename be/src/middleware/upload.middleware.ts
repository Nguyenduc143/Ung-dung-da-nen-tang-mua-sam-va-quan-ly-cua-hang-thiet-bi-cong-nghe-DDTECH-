import type { RequestHandler } from 'express';
import multer from 'multer';

import { MAX_PRODUCT_IMAGE_SIZE } from '../config/uploads';
import { AppError } from '../utils/app-error';

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const productImageParser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PRODUCT_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!acceptedImageTypes.has(file.mimetype)) {
      callback(new AppError(422, 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'));
      return;
    }
    callback(null, true);
  },
}).single('image');

export const receiveImage: RequestHandler = (req, res, next) => {
  productImageParser(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(413, 'Ảnh tải lên không được vượt quá 5 MB'));
        return;
      }
      next(new AppError(422, 'Dữ liệu tải ảnh không hợp lệ'));
      return;
    }
    next(error);
  });
};

export const receiveProductImage = receiveImage;
export const receiveCategoryImage = receiveImage;
export const receiveBrandImage = receiveImage;
