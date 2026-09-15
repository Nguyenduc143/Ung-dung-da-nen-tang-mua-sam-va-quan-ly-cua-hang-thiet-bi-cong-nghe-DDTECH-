import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';

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
  const [rows] = await pool.execute<FavoriteProductRecord[]>(
    `SELECT f.id, f.created_at AS createdAt, p.id AS productId,
            p.name, p.slug, p.sku, p.short_description AS shortDescription,
            p.price, p.sale_price AS salePrice, p.stock,
            p.has_variants AS hasVariants, p.rating_avg AS ratingAvg,
            p.review_count AS reviewCount, c.id AS categoryId,
            c.name AS categoryName, c.slug AS categorySlug,
            b.id AS brandId, b.name AS brandName, b.slug AS brandSlug,
            (SELECT pi.image_url FROM product_images pi
             WHERE pi.product_id = p.id
             ORDER BY pi.is_primary DESC, pi.sort_order, pi.id LIMIT 1) AS imageUrl
     FROM favorites f
     INNER JOIN products p ON p.id = f.product_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE f.user_id = ? AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
     ORDER BY f.created_at DESC, f.id DESC`,
    [userId],
  );
  return rows;
};

export const findProductForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<FavoriteProductStatusRecord | null> => {
  const [rows] = await connection.execute<FavoriteProductStatusRecord[]>(
    `SELECT id, status, deleted_at AS deletedAt
     FROM products WHERE id = ? LIMIT 1 FOR UPDATE`,
    [productId],
  );
  return rows[0] ?? null;
};

export const findFavorite = async (
  connection: PoolConnection,
  userId: number,
  productId: number,
): Promise<FavoriteRecord | null> => {
  const [rows] = await connection.execute<FavoriteRecord[]>(
    `SELECT id FROM favorites
     WHERE user_id = ? AND product_id = ? LIMIT 1 FOR UPDATE`,
    [userId, productId],
  );
  return rows[0] ?? null;
};

export const createFavorite = async (
  connection: PoolConnection,
  userId: number,
  productId: number,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
  );
  return result.insertId;
};

export const deleteFavorite = async (
  userId: number,
  productId: number,
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId],
  );
  return result.affectedRows > 0;
};
