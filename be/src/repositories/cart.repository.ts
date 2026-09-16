import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { executeProcedure, pool } from '../config/database';

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

export const findCartItemForUpdate = async (
  connection: PoolConnection,
  cartId: number,
  productId: number,
  variantId: number | null,
): Promise<OwnedCartItemRecord | null> => {
  const [rows] = await executeProcedure<OwnedCartItemRecord[]>(connection, 'sp_cart_findcartitemforupdate_1', [cartId, productId, variantId]);
  return rows[0] ?? null;
};

export const findOwnedCartItemForUpdate = async (
  connection: PoolConnection,
  cartId: number,
  itemId: number,
): Promise<OwnedCartItemRecord | null> => {
  const [rows] = await executeProcedure<OwnedCartItemRecord[]>(connection, 'sp_cart_findownedcartitemforupdate_1', [itemId, cartId]);
  return rows[0] ?? null;
};

export const createCartItem = async (
  connection: PoolConnection,
  cartId: number,
  productId: number,
  variantId: number | null,
  quantity: number,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_cart_createcartitem_1', [cartId, productId, variantId, quantity]);
  return result.insertId;
};

export const updateCartItemQuantity = async (
  connection: PoolConnection,
  cartId: number,
  itemId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_cart_updatecartitemquantity_1', [quantity, itemId, cartId]);
  return result.affectedRows > 0;
};

export const deleteCartItem = async (
  connection: PoolConnection,
  cartId: number,
  itemId: number,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_cart_deletecartitem_1', [itemId, cartId]);
  return result.affectedRows > 0;
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

export const listCartItems = async (cartId: number): Promise<CartItemDetailRecord[]> => {
  const [rows] = await executeProcedure<CartItemDetailRecord[]>(pool, 'sp_cart_listcartitems_1', [cartId]);
  return rows;
};
