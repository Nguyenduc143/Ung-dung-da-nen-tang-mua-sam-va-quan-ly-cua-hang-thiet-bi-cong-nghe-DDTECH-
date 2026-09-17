import type { ExecuteValues } from 'mysql2';
import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeDynamicProcedure,executeProcedure,pool } from '../config/database';
import type {
CreateVariantInput,
UpdateVariantInput
} from '../validators/product.validator';
import { Executor,toDatabaseValue } from './product.shared';

export interface VariantRecord extends RowDataPacket {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  attributes: unknown;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  soldCount: number;
  imageUrl: string | null;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export const VARIANT_COLUMNS = `id, product_id AS productId, sku, variant_name AS variantName,
  attributes, price, sale_price AS salePrice, stock, sold_count AS soldCount,
  image_url AS imageUrl, sort_order AS sortOrder, status,
  created_at AS createdAt, updated_at AS updatedAt`;

export const variantFields: Record<string, string> = {
  sku: 'sku',
  variantName: 'variant_name',
  attributes: 'attributes',
  price: 'price',
  salePrice: 'sale_price',
  stock: 'stock',
  imageUrl: 'image_url',
  sortOrder: 'sort_order',
  status: 'status',
};

export const listVariants = async (
  productId: number,
  publicOnly: boolean,
  db: Executor = pool,
): Promise<VariantRecord[]> => {
  const visible = publicOnly ? " AND status = 'ACTIVE'" : '';
  const [rows] = await executeDynamicProcedure<VariantRecord[]>(db, 'sp_dynamic_product_listvariants_1', `SELECT ${VARIANT_COLUMNS} FROM product_variants
     WHERE product_id = ?${visible}
     ORDER BY sort_order, id`, [productId]);
  return rows;
};

export const findVariant = async (
  variantId: number,
  db: Executor = pool,
): Promise<VariantRecord | null> => {
  const [rows] = await executeProcedure<VariantRecord[]>(db, 'sp_product_findvariant_1', [variantId]);
  return rows[0] ?? null;
};

export const saveVariant = async (
  productId: number,
  data: CreateVariantInput | UpdateVariantInput,
  variantId: number | undefined,
  db: PoolConnection,
): Promise<number> => {
  const entries = Object.entries(data).filter(
    ([key, value]) => key in variantFields && value !== undefined,
  );
  const values = entries.map(([key, value]) => toDatabaseValue(key, value)) as ExecuteValues[];

  if (variantId === undefined) {
    const [result] = await executeDynamicProcedure<ResultSetHeader>(db, 'sp_dynamic_product_savevariant_1', `INSERT INTO product_variants
         (product_id, ${entries.map(([key]) => `\`${variantFields[key]}\``).join(', ')})
       VALUES (?, ${entries.map(() => '?').join(', ')})`, [productId, ...values]);
    return result.insertId;
  }

  await executeDynamicProcedure(db, 'sp_dynamic_product_savevariant_2', `UPDATE product_variants
     SET ${entries.map(([key]) => `\`${variantFields[key]}\` = ?`).join(', ')}
     WHERE id = ? AND product_id = ?`, [...values, variantId, productId]);
  return variantId;
};

export const deleteVariant = async (
  productId: number,
  variantId: number,
  db: PoolConnection,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(db, 'sp_product_deletevariant_1', [variantId, productId]);
  return result.affectedRows > 0;
};

export const variantHasOrderHistory = async (
  variantId: number,
  db: PoolConnection,
): Promise<boolean> => {
  const [rows] = await executeProcedure<Array<RowDataPacket & { found: number }>>(db, 'sp_product_varianthasorderhistory_1', [variantId]);
  return rows.length > 0;
};

export const syncProductFromVariants = async (
  productId: number,
  db: PoolConnection,
): Promise<void> => {
  const [stockRows] = await executeProcedure<Array<RowDataPacket & { stock: string | number }>>(db, 'sp_product_syncproductfromvariants_1', [productId]);
  const [priceRows] = await executeProcedure<Array<RowDataPacket & {
    price: string | number;
    salePrice: string | number | null;
  }>>(db, 'sp_product_syncproductfromvariants_2', [productId]);
  const cheapest = priceRows[0];

  if (cheapest) {
    await executeProcedure(db, 'sp_product_syncproductfromvariants_3', [Number(stockRows[0]?.stock ?? 0), cheapest.price, cheapest.salePrice, productId]);
    return;
  }

  await executeProcedure(db, 'sp_product_syncproductfromvariants_4', [productId]);
};
