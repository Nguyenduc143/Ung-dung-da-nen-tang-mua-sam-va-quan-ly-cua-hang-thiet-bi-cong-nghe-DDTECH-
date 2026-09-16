import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { executeProcedure, pool } from '../config/database';

export interface FavoriteProductRecord extends RowDataPacket {
  id: number;
  createdAt: Date;
  productId: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  hasVariants: number;
  ratingAvg: string | number;
  reviewCount: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  brandId: number | null;
  brandName: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
}

interface FavoriteRecord extends RowDataPacket {
  id: number;
}

interface FavoriteProductStatusRecord extends RowDataPacket {
  id: number;
  status: 'ACTIVE' | 'INACTIVE';
  deletedAt: Date | null;
}

export const listByUser = async (userId: number): Promise<FavoriteProductRecord[]> => {
  const [rows] = await executeProcedure<FavoriteProductRecord[]>(pool, 'sp_favorite_listbyuser_1', [userId]);
  return rows;
};

export const findProductForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<FavoriteProductStatusRecord | null> => {
  const [rows] = await executeProcedure<FavoriteProductStatusRecord[]>(connection, 'sp_favorite_findproductforupdate_1', [productId]);
  return rows[0] ?? null;
};

export const findFavorite = async (
  connection: PoolConnection,
  userId: number,
  productId: number,
): Promise<FavoriteRecord | null> => {
  const [rows] = await executeProcedure<FavoriteRecord[]>(connection, 'sp_favorite_findfavorite_1', [userId, productId]);
  return rows[0] ?? null;
};

export const createFavorite = async (
  connection: PoolConnection,
  userId: number,
  productId: number,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_favorite_createfavorite_1', [userId, productId]);
  return result.insertId;
};

export const deleteFavorite = async (
  userId: number,
  productId: number,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(pool, 'sp_favorite_deletefavorite_1', [userId, productId]);
  return result.affectedRows > 0;
};
