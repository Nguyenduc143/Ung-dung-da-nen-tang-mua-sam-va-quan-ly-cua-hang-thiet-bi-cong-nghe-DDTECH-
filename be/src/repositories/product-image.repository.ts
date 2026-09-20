import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeProcedure,pool } from '../config/database';
import type {
CreateProductImageInput
} from '../validators/product.validator';
import { Executor } from './product.shared';

export interface ProductImageRecord extends RowDataPacket {
  id: number;
  productId: number;
  variantId: number | null;
  imageUrl: string;
  altText: string | null;
  isPrimary: number;
  sortOrder: number;
  createdAt: Date;
}

export const listImages = async (
  productId: number,
  db: Executor = pool,
): Promise<ProductImageRecord[]> => {
  const [rows] = await executeProcedure<ProductImageRecord[]>(db, 'sp_product_listimages_1', [productId]);
  return rows;
};

export const findImage = async (
  imageId: number,
  db: Executor = pool,
): Promise<ProductImageRecord | null> => {
  const [rows] = await executeProcedure<ProductImageRecord[]>(db, 'sp_product_findimage_1', [imageId]);
  return rows[0] ?? null;
};

export const lockImages = async (productId: number, db: PoolConnection): Promise<void> => {
  await executeProcedure(db, 'sp_product_lockimages_1', [productId]);
};

export const clearPrimaryImage = async (
  productId: number,
  db: PoolConnection,
): Promise<void> => {
  await executeProcedure(db, 'sp_product_clearprimaryimage_1', [productId]);
};

export const createImage = async (
  productId: number,
  input: CreateProductImageInput,
  isPrimary: boolean,
  db: PoolConnection,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(db, 'sp_product_createimage_1', [
      productId,
      input.variantId ?? null,
      input.imageUrl,
      input.altText ?? null,
      isPrimary ? 1 : 0,
      input.sortOrder ?? 0,
    ]);
  return result.insertId;
};

export const setPrimaryImage = async (
  productId: number,
  imageId: number,
  db: PoolConnection,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(db, 'sp_product_setprimaryimage_1', [imageId, productId]);
  return result.affectedRows > 0;
};

export const deleteImage = async (
  productId: number,
  imageId: number,
  db: PoolConnection,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(db, 'sp_product_deleteimage_1', [imageId, productId]);
  return result.affectedRows > 0;
};

export const findFirstImageId = async (
  productId: number,
  db: PoolConnection,
): Promise<number | null> => {
  const [rows] = await executeProcedure<Array<RowDataPacket & { id: number }>>(db, 'sp_product_findfirstimageid_1', [productId]);
  return rows[0]?.id ?? null;
};
