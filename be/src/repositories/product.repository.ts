import type { ExecuteValues } from 'mysql2';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';
import type {
  CreateProductImageInput,
  CreateProductInput,
  CreateVariantInput,
  ProductQuery,
  UpdateProductInput,
  UpdateVariantInput,
} from '../validators/product.validator';

type Executor = typeof pool | PoolConnection;

export interface ProductRecord extends RowDataPacket {
  id: number;
  categoryId: number;
  brandId: number | null;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  specifications: unknown;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  soldCount: number;
  hasVariants: number;
  warrantyMonths: number;
  weightGram: number | null;
  ratingAvg: string | number;
  reviewCount: number;
  viewCount: number;
  isFeatured: number;
  isNew: number;
  status: 'ACTIVE' | 'INACTIVE';
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryName: string;
  categorySlug: string;
  brandName: string | null;
  brandSlug: string | null;
  primaryImageUrl: string | null;
}

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

interface CatalogReferenceRecord extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
}

interface CountRecord extends RowDataPacket {
  total: number;
}

const PRODUCT_COLUMNS = `p.id, p.category_id AS categoryId, p.brand_id AS brandId,
  p.name, p.slug, p.sku, p.short_description AS shortDescription,
  p.description, p.specifications, p.price, p.sale_price AS salePrice,
  p.stock, p.sold_count AS soldCount, p.has_variants AS hasVariants,
  p.warranty_months AS warrantyMonths, p.weight_gram AS weightGram,
  p.rating_avg AS ratingAvg, p.review_count AS reviewCount,
  p.view_count AS viewCount, p.is_featured AS isFeatured, p.is_new AS isNew,
  p.status, p.deleted_at AS deletedAt, p.created_at AS createdAt,
  p.updated_at AS updatedAt, c.name AS categoryName, c.slug AS categorySlug,
  b.name AS brandName, b.slug AS brandSlug,
  (SELECT pi.image_url FROM product_images pi
   WHERE pi.product_id = p.id
   ORDER BY pi.is_primary DESC, pi.sort_order, pi.id LIMIT 1) AS primaryImageUrl`;

const VARIANT_COLUMNS = `id, product_id AS productId, sku, variant_name AS variantName,
  attributes, price, sale_price AS salePrice, stock, sold_count AS soldCount,
  image_url AS imageUrl, sort_order AS sortOrder, status,
  created_at AS createdAt, updated_at AS updatedAt`;

const productFields: Record<string, string> = {
  categoryId: 'category_id',
  brandId: 'brand_id',
  name: 'name',
  slug: 'slug',
  sku: 'sku',
  shortDescription: 'short_description',
  description: 'description',
  specifications: 'specifications',
  price: 'price',
  salePrice: 'sale_price',
  stock: 'stock',
  hasVariants: 'has_variants',
  warrantyMonths: 'warranty_months',
  weightGram: 'weight_gram',
  isFeatured: 'is_featured',
  isNew: 'is_new',
  status: 'status',
};

const variantFields: Record<string, string> = {
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

const toDatabaseValue = (key: string, value: unknown): unknown => {
  if (key === 'specifications' || key === 'attributes') {
    return value === null ? null : JSON.stringify(value);
  }
  if (key === 'hasVariants' || key === 'isFeatured' || key === 'isNew') {
    return value ? 1 : 0;
  }
  return value;
};

export const listPublicProducts = async (query: ProductQuery) => {
  const conditions = ["p.status = 'ACTIVE'", 'p.deleted_at IS NULL'];
  const values: Array<string | number> = [];

  if (query.search) {
    conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.sku LIKE ?)');
    const search = `%${query.search}%`;
    values.push(search, search, search);
  }
  if (query.category) {
    if (/^\d+$/.test(query.category)) {
      conditions.push('p.category_id = ?');
      values.push(Number(query.category));
    } else {
      conditions.push('c.slug = ?');
      values.push(query.category);
    }
  }
  if (query.brand) {
    if (/^\d+$/.test(query.brand)) {
      conditions.push('p.brand_id = ?');
      values.push(Number(query.brand));
    } else {
      conditions.push('b.slug = ?');
      values.push(query.brand);
    }
  }
  if (query.minPrice !== undefined) {
    conditions.push('COALESCE(p.sale_price, p.price) >= ?');
    values.push(query.minPrice);
  }
  if (query.maxPrice !== undefined) {
    conditions.push('COALESCE(p.sale_price, p.price) <= ?');
    values.push(query.maxPrice);
  }
  if (query.featured !== undefined) {
    conditions.push('p.is_featured = ?');
    values.push(query.featured ? 1 : 0);
  }
  if (query.new !== undefined) {
    conditions.push('p.is_new = ?');
    values.push(query.new ? 1 : 0);
  }

  const sortMap: Record<ProductQuery['sort'], string> = {
    price_asc: 'COALESCE(p.sale_price, p.price) ASC, p.id DESC',
    price_desc: 'COALESCE(p.sale_price, p.price) DESC, p.id DESC',
    newest: 'p.created_at DESC, p.id DESC',
    best_selling: 'p.sold_count DESC, p.id DESC',
    rating: 'p.rating_avg DESC, p.review_count DESC, p.id DESC',
  };
  const where = conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [products] = await executeDynamicProcedure<ProductRecord[]>(pool, 'sp_dynamic_product_listpublicproducts_1', `SELECT ${PRODUCT_COLUMNS}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ${where}
     ORDER BY ${sortMap[query.sort]}
     LIMIT ? OFFSET ?`, [...values, query.limit, offset]);
  const [countRows] = await executeDynamicProcedure<CountRecord[]>(pool, 'sp_dynamic_product_listpublicproducts_2', `SELECT COUNT(*) AS total
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ${where}`, values);

  return { products, total: countRows[0]?.total ?? 0 };
};

export const findProduct = async (
  key: number | string,
  publicOnly = false,
  db: Executor = pool,
): Promise<ProductRecord | null> => {
  const keyColumn = typeof key === 'number' ? 'p.id' : 'p.slug';
  const visible = " AND p.deleted_at IS NULL" + (publicOnly ? " AND p.status = 'ACTIVE'" : '');
  const [rows] = await executeDynamicProcedure<ProductRecord[]>(db, 'sp_dynamic_product_findproduct_1', `SELECT ${PRODUCT_COLUMNS}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ${keyColumn} = ?${visible}
     LIMIT 1`, [key]);
  return rows[0] ?? null;
};

export const findCategory = async (
  categoryId: number,
  db: Executor = pool,
): Promise<CatalogReferenceRecord | null> => {
  const [rows] = await executeProcedure<CatalogReferenceRecord[]>(db, 'sp_product_findcategory_1', [categoryId]);
  return rows[0] ?? null;
};

export const findBrand = async (
  brandId: number,
  db: Executor = pool,
): Promise<CatalogReferenceRecord | null> => {
  const [rows] = await executeProcedure<CatalogReferenceRecord[]>(db, 'sp_product_findbrand_1', [brandId]);
  return rows[0] ?? null;
};

export const saveProduct = async (
  data: CreateProductInput | UpdateProductInput,
  productId: number | undefined,
  db: Executor,
): Promise<number> => {
  const entries = Object.entries(data).filter(
    ([key, value]) => key in productFields && value !== undefined,
  );
  const values = entries.map(([key, value]) => toDatabaseValue(key, value)) as ExecuteValues[];
  const sql = productId === undefined
    ? `INSERT INTO products (${entries.map(([key]) => `\`${productFields[key]}\``).join(', ')})
       VALUES (${entries.map(() => '?').join(', ')})`
    : `UPDATE products SET ${entries.map(([key]) => `\`${productFields[key]}\` = ?`).join(', ')}
       WHERE id = ? AND deleted_at IS NULL`;
  const parameters = productId === undefined ? values : [...values, productId];
  const [result] = await executeDynamicProcedure<ResultSetHeader>(db, 'sp_dynamic_product_saveproduct_1', sql, parameters);
  return productId ?? result.insertId;
};

export const softDeleteProduct = async (
  productId: number,
  db: PoolConnection,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(db, 'sp_product_softdeleteproduct_1', [productId]);
  return result.affectedRows > 0;
};

export const lockProduct = async (
  productId: number,
  db: PoolConnection,
): Promise<void> => {
  await executeProcedure(db, 'sp_product_lockproduct_1', [productId]);
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
