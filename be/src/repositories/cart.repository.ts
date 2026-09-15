import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';

export interface CartRecord extends RowDataPacket {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartProductRecord extends RowDataPacket {
  id: number;
  hasVariants: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE';
  deletedAt: Date | null;
}

export interface CartVariantRecord extends RowDataPacket {
  id: number;
  productId: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface OwnedCartItemRecord extends RowDataPacket {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
}

export interface CartItemDetailRecord extends RowDataPacket {
  id: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  productId: number;
  productName: string;
  productSlug: string;
  productSku: string;
  productStatus: 'ACTIVE' | 'INACTIVE';
  productDeletedAt: Date | null;
  hasVariants: number;
  productPrice: string | number;
  productSalePrice: string | number | null;
  productStock: number;
  ratingAvg: string | number;
  reviewCount: number;
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  variantAttributes: unknown;
  variantPrice: string | number | null;
  variantSalePrice: string | number | null;
  variantStock: number | null;
  variantStatus: 'ACTIVE' | 'INACTIVE' | null;
  currentPrice: string | number;
  availableStock: number;
  imageUrl: string | null;
}

export const getOrCreateCart = async (
  connection: PoolConnection,
  userId: number,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO carts (user_id) VALUES (?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [userId],
  );
  return result.insertId;
};

export const findCartByUser = async (userId: number): Promise<CartRecord | null> => {
  const [rows] = await pool.execute<CartRecord[]>(
    `SELECT id, user_id AS userId, created_at AS createdAt, updated_at AS updatedAt
     FROM carts WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
};

export const findProductForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<CartProductRecord | null> => {
  const [rows] = await connection.execute<CartProductRecord[]>(
    `SELECT id, has_variants AS hasVariants, stock, status, deleted_at AS deletedAt
     FROM products WHERE id = ? LIMIT 1 FOR UPDATE`,
    [productId],
  );
  return rows[0] ?? null;
};

export const findVariantForUpdate = async (
  connection: PoolConnection,
  variantId: number,
): Promise<CartVariantRecord | null> => {
  const [rows] = await connection.execute<CartVariantRecord[]>(
    `SELECT id, product_id AS productId, stock, status
     FROM product_variants WHERE id = ? LIMIT 1 FOR UPDATE`,
    [variantId],
  );
  return rows[0] ?? null;
};

export const findCartItemForUpdate = async (
  connection: PoolConnection,
  cartId: number,
  productId: number,
  variantId: number | null,
): Promise<OwnedCartItemRecord | null> => {
  const [rows] = await connection.execute<OwnedCartItemRecord[]>(
    `SELECT id, cart_id AS cartId, product_id AS productId,
            variant_id AS variantId, quantity
     FROM cart_items
     WHERE cart_id = ? AND product_id = ? AND variant_id <=> ?
     LIMIT 1 FOR UPDATE`,
    [cartId, productId, variantId],
  );
  return rows[0] ?? null;
};

export const findOwnedCartItemForUpdate = async (
  connection: PoolConnection,
  cartId: number,
  itemId: number,
): Promise<OwnedCartItemRecord | null> => {
  const [rows] = await connection.execute<OwnedCartItemRecord[]>(
    `SELECT id, cart_id AS cartId, product_id AS productId,
            variant_id AS variantId, quantity
     FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1 FOR UPDATE`,
    [itemId, cartId],
  );
  return rows[0] ?? null;
};

export const createCartItem = async (
  connection: PoolConnection,
  cartId: number,
  productId: number,
  variantId: number | null,
  quantity: number,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
     VALUES (?, ?, ?, ?)`,
    [cartId, productId, variantId, quantity],
  );
  return result.insertId;
};

export const updateCartItemQuantity = async (
  connection: PoolConnection,
  cartId: number,
  itemId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
    [quantity, itemId, cartId],
  );
  return result.affectedRows > 0;
};

export const deleteCartItem = async (
  connection: PoolConnection,
  cartId: number,
  itemId: number,
): Promise<boolean> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
    [itemId, cartId],
  );
  return result.affectedRows > 0;
};

export const clearCart = async (
  connection: PoolConnection,
  cartId: number,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'DELETE FROM cart_items WHERE cart_id = ?',
    [cartId],
  );
  return result.affectedRows;
};

export const touchCart = async (
  connection: PoolConnection,
  cartId: number,
): Promise<void> => {
  await connection.execute('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cartId]);
};

export const listCartItems = async (cartId: number): Promise<CartItemDetailRecord[]> => {
  const [rows] = await pool.execute<CartItemDetailRecord[]>(
    `SELECT ci.id, ci.quantity, ci.created_at AS createdAt, ci.updated_at AS updatedAt,
            p.id AS productId, p.name AS productName, p.slug AS productSlug,
            p.sku AS productSku, p.status AS productStatus,
            p.deleted_at AS productDeletedAt, p.has_variants AS hasVariants,
            p.price AS productPrice, p.sale_price AS productSalePrice,
            p.stock AS productStock, p.rating_avg AS ratingAvg,
            p.review_count AS reviewCount,
            pv.id AS variantId, pv.variant_name AS variantName, pv.sku AS variantSku,
            pv.attributes AS variantAttributes, pv.price AS variantPrice,
            pv.sale_price AS variantSalePrice, pv.stock AS variantStock,
            pv.status AS variantStatus,
            CASE WHEN ci.variant_id IS NULL
                 THEN COALESCE(p.sale_price, p.price)
                 ELSE COALESCE(pv.sale_price, pv.price)
            END AS currentPrice,
            CASE WHEN ci.variant_id IS NULL THEN p.stock ELSE pv.stock END AS availableStock,
            COALESCE(
              pv.image_url,
              (SELECT pi.image_url FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY (pi.variant_id = ci.variant_id) DESC,
                        pi.is_primary DESC, pi.sort_order, pi.id
               LIMIT 1)
            ) AS imageUrl
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at DESC, ci.id DESC`,
    [cartId],
  );
  return rows;
};
