import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeProcedure,pool } from '../config/database';

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

export const getOrCreateCart = async (
  connection: PoolConnection,
  userId: number,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_cart_getorcreatecart_1', [userId]);
  return result.insertId;
};

export const findCartByUser = async (userId: number): Promise<CartRecord | null> => {
  const [rows] = await executeProcedure<CartRecord[]>(pool, 'sp_cart_findcartbyuser_1', [userId]);
  return rows[0] ?? null;
};

export const findProductForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<CartProductRecord | null> => {
  const [rows] = await executeProcedure<CartProductRecord[]>(connection, 'sp_cart_findproductforupdate_1', [productId]);
  return rows[0] ?? null;
};

export const findVariantForUpdate = async (
  connection: PoolConnection,
  variantId: number,
): Promise<CartVariantRecord | null> => {
  const [rows] = await executeProcedure<CartVariantRecord[]>(connection, 'sp_cart_findvariantforupdate_1', [variantId]);
  return rows[0] ?? null;
};

export const clearCart = async (
  connection: PoolConnection,
  cartId: number,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_cart_clearcart_1', [cartId]);
  return result.affectedRows;
};

export const touchCart = async (
  connection: PoolConnection,
  cartId: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_cart_touchcart_1', [cartId]);
};
