import path from 'node:path';

export const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
export const PRODUCT_IMAGE_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'products');
export const PRODUCT_IMAGE_PUBLIC_PATH = '/uploads/products';
export const CATEGORY_IMAGE_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'categories');
export const CATEGORY_IMAGE_PUBLIC_PATH = '/uploads/categories';
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
