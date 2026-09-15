import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type {
  InventoryQuery,
  InventoryTransactionQuery,
} from '../validators/inventory.validator';

export interface InventoryProductRecord extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  soldCount: number;
  hasVariants: number;
  status: 'ACTIVE' | 'INACTIVE';
  deletedAt: Date | null;
  updatedAt: Date;
}

export interface InventoryVariantRecord extends RowDataPacket {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  stock: number;
  soldCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  updatedAt: Date;
}

export interface InventoryTransactionRecord extends RowDataPacket {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  type: 'IMPORT' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'CANCEL_ORDER';
  quantity: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: Date;
}

export interface LowStockRecord extends RowDataPacket {
  productId: number;
  productName: string;
  productSku: string;
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  stock: number;
}

interface CountRecord extends RowDataPacket {
  total: number;
}

interface StockSumRecord extends RowDataPacket {
  total: string | number;
}

const PRODUCT_COLUMNS = `id, name, slug, sku, stock, sold_count AS soldCount,
  has_variants AS hasVariants, status, deleted_at AS deletedAt,
  updated_at AS updatedAt`;

const VARIANT_COLUMNS = `id, product_id AS productId, sku,
  variant_name AS variantName, stock, sold_count AS soldCount,
  status, updated_at AS updatedAt`;

export const listInventory = async (query: InventoryQuery) => {
  const conditions = ['deleted_at IS NULL'];
  const values: Array<string | number> = [];
  if (query.search) {
    conditions.push('(name LIKE ? OR sku LIKE ?)');
    const search = `%${query.search}%`;
    values.push(search, search);
  }
  if (query.status) {
    conditions.push('status = ?');
    values.push(query.status);
  }
  const where = conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [products] = await pool.execute<InventoryProductRecord[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM products
     WHERE ${where} ORDER BY updated_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...values, query.limit, offset],
  );
  const [countRows] = await pool.execute<CountRecord[]>(
    `SELECT COUNT(*) AS total FROM products WHERE ${where}`,
    values,
  );
  let variants: InventoryVariantRecord[] = [];
  if (products.length > 0) {
    const placeholders = products.map(() => '?').join(', ');
    const [variantRows] = await pool.execute<InventoryVariantRecord[]>(
      `SELECT ${VARIANT_COLUMNS} FROM product_variants
       WHERE product_id IN (${placeholders})
       ORDER BY product_id, sort_order, id`,
      products.map((product) => product.id),
    );
    variants = variantRows;
  }
  return { products, variants, total: countRows[0]?.total ?? 0 };
};

export const listLowStock = async (threshold: number): Promise<LowStockRecord[]> => {
  const [rows] = await pool.execute<LowStockRecord[]>(
    `SELECT p.id AS productId, p.name AS productName, p.sku AS productSku,
            NULL AS variantId, NULL AS variantName, NULL AS variantSku, p.stock
     FROM products p
     WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE'
       AND p.has_variants = 0 AND p.stock <= ?
     UNION ALL
     SELECT p.id, p.name, p.sku, pv.id, pv.variant_name, pv.sku, pv.stock
     FROM products p
     INNER JOIN product_variants pv ON pv.product_id = p.id
     WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE'
       AND p.has_variants = 1 AND pv.status = 'ACTIVE' AND pv.stock <= ?
     ORDER BY stock, productId, variantId`,
    [threshold, threshold],
  );
  return rows;
};

export const listTransactions = async (query: InventoryTransactionQuery) => {
  const conditions: string[] = [];
  const values: Array<string | number | Date> = [];
  if (query.productId !== undefined) {
    conditions.push('it.product_id = ?');
    values.push(query.productId);
  }
  if (query.variantId !== undefined) {
    conditions.push('it.variant_id = ?');
    values.push(query.variantId);
  }
  if (query.createdBy !== undefined) {
    conditions.push('it.created_by = ?');
    values.push(query.createdBy);
  }
  if (query.type !== undefined) {
    conditions.push('it.type = ?');
    values.push(query.type);
  }
  if (query.dateFrom !== undefined) {
    conditions.push('it.created_at >= ?');
    values.push(query.dateFrom);
  }
  if (query.dateTo !== undefined) {
    conditions.push('it.created_at <= ?');
    values.push(query.dateTo);
  }
  const where = conditions.length === 0 ? '1 = 1' : conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [transactions] = await pool.execute<InventoryTransactionRecord[]>(
    `SELECT it.id, it.product_id AS productId, p.name AS productName,
            p.sku AS productSku, it.variant_id AS variantId,
            pv.variant_name AS variantName, pv.sku AS variantSku,
            it.type, it.quantity, it.stock_after AS stockAfter,
            it.reference_type AS referenceType, it.reference_id AS referenceId,
            it.note, it.created_by AS createdBy, u.full_name AS createdByName,
            it.created_at AS createdAt
     FROM inventory_transactions it
     INNER JOIN products p ON p.id = it.product_id
     LEFT JOIN product_variants pv ON pv.id = it.variant_id
     LEFT JOIN users u ON u.id = it.created_by
     WHERE ${where}
     ORDER BY it.created_at DESC, it.id DESC
     LIMIT ? OFFSET ?`,
    [...values, query.limit, offset],
  );
  const [countRows] = await pool.execute<CountRecord[]>(
    `SELECT COUNT(*) AS total FROM inventory_transactions it WHERE ${where}`,
    values,
  );
  return { transactions, total: countRows[0]?.total ?? 0 };
};

export const findProductForUpdate = async (
  productId: number,
  connection: PoolConnection,
): Promise<InventoryProductRecord | null> => {
  const [rows] = await connection.execute<InventoryProductRecord[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ? LIMIT 1 FOR UPDATE`,
    [productId],
  );
  return rows[0] ?? null;
};

export const findVariantForUpdate = async (
  variantId: number,
  connection: PoolConnection,
): Promise<InventoryVariantRecord | null> => {
  const [rows] = await connection.execute<InventoryVariantRecord[]>(
    `SELECT ${VARIANT_COLUMNS} FROM product_variants
     WHERE id = ? LIMIT 1 FOR UPDATE`,
    [variantId],
  );
  return rows[0] ?? null;
};

export const updateProductStock = async (
  productId: number,
  stock: number,
  connection: PoolConnection,
): Promise<void> => {
  await connection.execute('UPDATE products SET stock = ? WHERE id = ?', [stock, productId]);
};

export const updateVariantStock = async (
  variantId: number,
  stock: number,
  connection: PoolConnection,
): Promise<void> => {
  await connection.execute(
    'UPDATE product_variants SET stock = ? WHERE id = ?',
    [stock, variantId],
  );
};

export const sumVariantStock = async (
  productId: number,
  connection: PoolConnection,
): Promise<string | number> => {
  const [rows] = await connection.execute<StockSumRecord[]>(
    'SELECT COALESCE(SUM(stock), 0) AS total FROM product_variants WHERE product_id = ?',
    [productId],
  );
  return rows[0]?.total ?? 0;
};

export const createTransaction = async (
  data: {
    productId: number;
    variantId: number | null;
    type: 'IMPORT' | 'ADJUSTMENT';
    quantity: number;
    stockAfter: number;
    note: string | null;
    createdBy: number;
  },
  connection: PoolConnection,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO inventory_transactions
       (product_id, variant_id, type, quantity, stock_after, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.productId,
      data.variantId,
      data.type,
      data.quantity,
      data.stockAfter,
      data.note,
      data.createdBy,
    ],
  );
  return result.insertId;
};

export const findTransaction = async (
  transactionId: number,
): Promise<InventoryTransactionRecord | null> => {
  const [rows] = await pool.execute<InventoryTransactionRecord[]>(
    `SELECT it.id, it.product_id AS productId, p.name AS productName,
            p.sku AS productSku, it.variant_id AS variantId,
            pv.variant_name AS variantName, pv.sku AS variantSku,
            it.type, it.quantity, it.stock_after AS stockAfter,
            it.reference_type AS referenceType, it.reference_id AS referenceId,
            it.note, it.created_by AS createdBy, u.full_name AS createdByName,
            it.created_at AS createdAt
     FROM inventory_transactions it
     INNER JOIN products p ON p.id = it.product_id
     LEFT JOIN product_variants pv ON pv.id = it.variant_id
     LEFT JOIN users u ON u.id = it.created_by
     WHERE it.id = ? LIMIT 1`,
    [transactionId],
  );
  return rows[0] ?? null;
};
