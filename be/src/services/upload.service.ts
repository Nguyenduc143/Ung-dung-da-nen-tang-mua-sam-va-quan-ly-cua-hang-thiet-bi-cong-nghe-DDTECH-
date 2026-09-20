import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  CATEGORY_IMAGE_PUBLIC_PATH,
  CATEGORY_IMAGE_UPLOAD_DIR,
  PRODUCT_IMAGE_PUBLIC_PATH,
  PRODUCT_IMAGE_UPLOAD_DIR,
} from '../config/uploads';
import { AppError } from '../utils/app-error';

const productImageFilenamePattern = /^product-\d+-[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;
const categoryImageFilenamePattern = /^category-\d+-[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

const imageSignatures = [
  {
    extension: 'jpg',
    mimeType: 'image/jpeg',
    matches: (buffer: Buffer) => (
      buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff
    ),
  },
  {
    extension: 'png',
    mimeType: 'image/png',
    matches: (buffer: Buffer) => (
      buffer.length >= 8
      && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ),
  },
  {
    extension: 'webp',
    mimeType: 'image/webp',
    matches: (buffer: Buffer) => (
      buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ),
  },
] as const;

export interface StoredProductImage {
  filename: string;
  mimeType: string;
  size: number;
}

const storeImage = async (
  file: Express.Multer.File,
  directory: string,
  filenamePrefix: string,
): Promise<StoredProductImage> => {
  const signature = imageSignatures.find((item) => item.matches(file.buffer));
  if (!signature) {
    throw new AppError(422, 'Nội dung file không phải ảnh JPG, PNG hoặc WEBP hợp lệ');
  }

  await mkdir(directory, { recursive: true });
  const filename = `${filenamePrefix}-${Date.now()}-${randomUUID()}.${signature.extension}`;
  await writeFile(path.join(directory, filename), file.buffer, { flag: 'wx' });

  return {
    filename,
    mimeType: signature.mimeType,
    size: file.size,
  };
};

export const storeProductImage = (file: Express.Multer.File): Promise<StoredProductImage> => (
  storeImage(file, PRODUCT_IMAGE_UPLOAD_DIR, 'product')
);

export const storeCategoryImage = (file: Express.Multer.File): Promise<StoredProductImage> => (
  storeImage(file, CATEGORY_IMAGE_UPLOAD_DIR, 'category')
);

const removeStoredImage = async (
  filename: string,
  directory: string,
  filenamePattern: RegExp,
): Promise<void> => {
  if (filename !== path.basename(filename) || !filenamePattern.test(filename)) return;

  try {
    await unlink(path.join(directory, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
};

export const removeStoredProductImage = (filename: string): Promise<void> => (
  removeStoredImage(filename, PRODUCT_IMAGE_UPLOAD_DIR, productImageFilenamePattern)
);

export const removeStoredCategoryImage = (filename: string): Promise<void> => (
  removeStoredImage(filename, CATEGORY_IMAGE_UPLOAD_DIR, categoryImageFilenamePattern)
);

const storedFilenameFromUrl = (imageUrl: string, publicPath: string): string | null => {
  let pathname: string;
  try {
    pathname = new URL(imageUrl).pathname;
  } catch {
    return null;
  }

  const prefix = `${publicPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  return decodeURIComponent(pathname.slice(prefix.length));
};

export const removeStoredProductImageByUrl = async (imageUrl: string): Promise<void> => {
  const filename = storedFilenameFromUrl(imageUrl, PRODUCT_IMAGE_PUBLIC_PATH);
  if (filename) await removeStoredProductImage(filename);
};

export const removeStoredCategoryImageByUrl = async (imageUrl: string): Promise<void> => {
  const filename = storedFilenameFromUrl(imageUrl, CATEGORY_IMAGE_PUBLIC_PATH);
  if (filename) await removeStoredCategoryImage(filename);
};
