import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type { AddCartItemInput } from '../validators/cart.validator';

export interface CartItemRecord extends RowDataPacket {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image: string | null;
  product_price: string | number;
  product_sale_price: string | number | null;
  product_stock: number;
  product_status: 'ACTIVE' | 'INACTIVE';
  product_deleted_at: Date | null;
  variant_name: string | null;
  variant_sku: string | null;
  variant_price: string | number | null;
  variant_sale_price: string | number | null;
  variant_stock: number | null;
  variant_status: 'ACTIVE' | 'INACTIVE' | null;
}

interface CartRecord extends RowDataPacket {
  id: number;
  user_id: number;
}

export interface FavoriteRecord extends RowDataPacket {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image: string | null;
  price: string | number;
  sale_price: string | number | null;
  stock: number;
  rating_avg: string | number;
  review_count: number;
  created_at: Date;
}

const CART_ITEM_COLUMNS = `ci.id, ci.cart_id, ci.product_id, ci.variant_id, ci.quantity,
  p.name AS product_name, p.slug AS product_slug, p.sku AS product_sku,
  (SELECT pi.image_url FROM product_images pi
   WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1)
   AS product_image,
  p.price AS product_price, p.sale_price AS product_sale_price, p.stock AS product_stock,
  p.status AS product_status, p.deleted_at AS product_deleted_at,
  pv.variant_name, pv.sku AS variant_sku, pv.price AS variant_price,
  pv.sale_price AS variant_sale_price, pv.stock AS variant_stock, pv.status AS variant_status`;

export const findCartByUser = async (userId: number): Promise<CartRecord | null> => {
  const [rows] = await pool.execute<CartRecord[]>(
    'SELECT id, user_id FROM carts WHERE user_id = ? LIMIT 1',
    [userId],
  );
  return rows[0] ?? null;
};

const findCartByUserForUpdate = async (
  connection: PoolConnection,
  userId: number,
): Promise<CartRecord | null> => {
  const [rows] = await connection.execute<CartRecord[]>(
    'SELECT id, user_id FROM carts WHERE user_id = ? LIMIT 1 FOR UPDATE',
    [userId],
  );
  return rows[0] ?? null;
};

const createCart = async (connection: PoolConnection, userId: number): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId],
  );
  return result.insertId;
};

export const getOrCreateCart = async (
  connection: PoolConnection,
  userId: number,
): Promise<CartRecord> => {
  const existing = await findCartByUserForUpdate(connection, userId);
  if (existing) return existing;
  const cartId = await createCart(connection, userId);
  return { id: cartId, user_id: userId } as CartRecord;
};

export const listItems = async (userId: number): Promise<CartItemRecord[]> => {
  const [rows] = await pool.execute<CartItemRecord[]>(
    `SELECT ${CART_ITEM_COLUMNS}
     FROM carts c
     INNER JOIN cart_items ci ON ci.cart_id = c.id
     INNER JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE c.user_id = ? ORDER BY ci.created_at DESC`,
    [userId],
  );
  return rows;
};

export const findItemForUpdate = async (
  connection: PoolConnection,
  cartId: number,
  productId: number,
  variantId: number | null,
): Promise<CartItemRecord | null> => {
  const [rows] = await connection.execute<CartItemRecord[]>(
    `SELECT ${CART_ITEM_COLUMNS}
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE ci.cart_id = ? AND ci.product_id = ?
       AND (ci.variant_id = ? OR (ci.variant_id IS NULL AND ? IS NULL))
     LIMIT 1 FOR UPDATE`,
    [cartId, productId, variantId, variantId],
  );
  return rows[0] ?? null;
};

export const addItem = async (
  connection: PoolConnection,
  cartId: number,
  input: AddCartItemInput,
): Promise<void> => {
  await connection.execute(
    `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
     VALUES (?, ?, ?, ?)`,
    [cartId, input.productId, input.variantId ?? null, input.quantity],
  );
};

export const updateItemQuantity = async (
  connection: PoolConnection,
  itemId: number,
  quantity: number,
): Promise<void> => {
  await connection.execute(
    'UPDATE cart_items SET quantity = ? WHERE id = ?',
    [quantity, itemId],
  );
};

export const findItemByIdForUser = async (
  userId: number,
  itemId: number,
): Promise<CartItemRecord | null> => {
  const [rows] = await pool.execute<CartItemRecord[]>(
    `SELECT ${CART_ITEM_COLUMNS}
     FROM carts c
     INNER JOIN cart_items ci ON ci.cart_id = c.id
     INNER JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE c.user_id = ? AND ci.id = ? LIMIT 1`,
    [userId, itemId],
  );
  return rows[0] ?? null;
};

export const deleteItem = async (userId: number, itemId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE ci FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     WHERE c.user_id = ? AND ci.id = ?`,
    [userId, itemId],
  );
  return result.affectedRows > 0;
};

export const clearCart = async (userId: number): Promise<void> => {
  await pool.execute(
    `DELETE ci FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id WHERE c.user_id = ?`,
    [userId],
  );
};

export const listFavorites = async (userId: number): Promise<FavoriteRecord[]> => {
  const [rows] = await pool.execute<FavoriteRecord[]>(
    `SELECT f.id, f.product_id, p.name AS product_name, p.slug AS product_slug, p.sku AS product_sku,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1)
        AS product_image,
       p.price, p.sale_price, p.stock, p.rating_avg, p.review_count, f.created_at
     FROM favorites f INNER JOIN products p ON p.id = f.product_id
     WHERE f.user_id = ? AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
     ORDER BY f.created_at DESC`,
    [userId],
  );
  return rows;
};

export const addFavorite = async (userId: number, productId: number): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
  );
  return result.insertId;
};

export const removeFavorite = async (userId: number, productId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId],
  );
  return result.affectedRows > 0;
};