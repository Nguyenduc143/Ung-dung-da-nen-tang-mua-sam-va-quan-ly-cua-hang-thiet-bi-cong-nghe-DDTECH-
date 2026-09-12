import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type {
  CreateImageInput,
  CreateProductInput,
  CreateVariantInput,
  ProductQuery,
  UpdateProductInput,
  UpdateVariantInput,
} from '../validators/product.validator';

export interface ProductRecord extends RowDataPacket {
  id: number;
  category_id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  specifications: unknown;
  price: string | number;
  sale_price: string | number | null;
  stock: number;
  sold_count: number;
  has_variants: number;
  warranty_months: number;
  weight_gram: number | null;
  rating_avg: string | number;
  review_count: number;
  view_count: number;
  is_featured: number;
  is_new: number;
  status: 'ACTIVE' | 'INACTIVE';
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  category_slug?: string;
  brand_name?: string | null;
  brand_slug?: string | null;
  primary_image_url?: string | null;
}

export interface VariantRecord extends RowDataPacket {
  id: number;
  product_id: number;
  sku: string;
  variant_name: string;
  attributes: unknown;
  price: string | number;
  sale_price: string | number | null;
  stock: number;
  sold_count: number;
  image_url: string | null;
  sort_order: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface ImageRecord extends RowDataPacket {
  id: number;
  product_id: number;
  variant_id: number | null;
  image_url: string;
  alt_text: string | null;
  is_primary: number;
  sort_order: number;
  created_at: Date;
}

const PRODUCT_COLUMNS = `p.id, p.category_id, p.brand_id, p.name, p.slug, p.sku,
  p.short_description, p.description, p.specifications, p.price, p.sale_price, p.stock,
  p.sold_count, p.has_variants, p.warranty_months, p.weight_gram, p.rating_avg,
  p.review_count, p.view_count, p.is_featured, p.is_new, p.status, p.deleted_at,
  p.created_at, p.updated_at`;
const DETAIL_PRODUCT_COLUMNS = `${PRODUCT_COLUMNS}, c.name AS category_name, c.slug AS category_slug,
  b.name AS brand_name, b.slug AS brand_slug,
  (SELECT pi.image_url FROM product_images pi
   WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1)
   AS primary_image_url`;
const VARIANT_COLUMNS = `id, product_id, sku, variant_name, attributes, price, sale_price, stock,
  sold_count, image_url, sort_order, status, created_at, updated_at`;
const IMAGE_COLUMNS = `id, product_id, variant_id, image_url, alt_text, is_primary, sort_order, created_at`;

const toJsonValue = (value: unknown): string | null =>
  value === undefined || value === null ? null : JSON.stringify(value);

export const listPublic = async (query: ProductQuery) => {
  const conditions = ["p.status = 'ACTIVE'", 'p.deleted_at IS NULL'];
  const values: Array<string | number> = [];

  if (query.search) {
    conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.sku LIKE ?)');
    const search = `%${query.search}%`;
    values.push(search, search, search);
  }
  if (query.category) {
    conditions.push('c.slug = ?');
    values.push(query.category);
  }
  if (query.brand) {
    conditions.push('b.slug = ?');
    values.push(query.brand);
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
    price_asc: 'COALESCE(p.sale_price, p.price) ASC',
    price_desc: 'COALESCE(p.sale_price, p.price) DESC',
    newest: 'p.created_at DESC',
    best_selling: 'p.sold_count DESC',
    rating: 'p.rating_avg DESC',
  };
  const where = conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [products] = await pool.execute<ProductRecord[]>(
    `SELECT ${DETAIL_PRODUCT_COLUMNS}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ${where}
     ORDER BY ${sortMap[query.sort]}, p.id DESC LIMIT ? OFFSET ?`,
    [...values, query.limit, offset],
  );
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ${where}`,
    values,
  );

  return { products, total: Number(countRows[0]?.total ?? 0) };
};

export const findPublicById = async (productId: number): Promise<ProductRecord | null> => {
  const [rows] = await pool.execute<ProductRecord[]>(
    `SELECT ${DETAIL_PRODUCT_COLUMNS}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.id = ? AND p.status = 'ACTIVE' AND p.deleted_at IS NULL LIMIT 1`,
    [productId],
  );
  return rows[0] ?? null;
};

export const findPublicBySlug = async (slug: string): Promise<ProductRecord | null> => {
  const [rows] = await pool.execute<ProductRecord[]>(
    `SELECT ${DETAIL_PRODUCT_COLUMNS}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.slug = ? AND p.status = 'ACTIVE' AND p.deleted_at IS NULL LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
};

export const findById = async (productId: number): Promise<ProductRecord | null> => {
  const [rows] = await pool.execute<ProductRecord[]>(
    `SELECT ${DETAIL_PRODUCT_COLUMNS}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.id = ? LIMIT 1`,
    [productId],
  );
  return rows[0] ?? null;
};

export const create = async (input: CreateProductInput, slug: string): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO products
       (category_id, brand_id, name, slug, sku, short_description, description, specifications,
        price, sale_price, stock, has_variants, warranty_months, weight_gram, is_featured, is_new, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.categoryId,
      input.brandId ?? null,
      input.name,
      slug,
      input.sku,
      input.shortDescription ?? null,
      input.description ?? null,
      toJsonValue(input.specifications),
      input.price,
      input.salePrice ?? null,
      input.hasVariants ? 0 : input.stock,
      input.hasVariants ? 1 : 0,
      input.warrantyMonths,
      input.weightGram ?? null,
      input.isFeatured ? 1 : 0,
      input.isNew ? 1 : 0,
      input.status,
    ],
  );
  return result.insertId;
};

export const update = async (
  productId: number,
  input: UpdateProductInput,
  slug?: string,
): Promise<boolean> => {
  const fieldMap: Record<string, string> = {
    categoryId: 'category_id',
    brandId: 'brand_id',
    name: 'name',
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
  const entries = Object.entries(input).filter(([field]) => field !== 'slug');
  const assignments = entries.map(([field]) => `${fieldMap[field]} = ?`);
  const values: Array<string | number | null> = entries.map(([field, value]) => {
    if (field === 'specifications') return toJsonValue(value);
    if (field === 'brandId' || field === 'description' || field === 'shortDescription' || field === 'salePrice' || field === 'weightGram') {
      return (value ?? null) as string | number | null;
    }
    if (field === 'hasVariants' || field === 'isFeatured' || field === 'isNew') return value ? 1 : 0;
    return value as string | number | null;
  });

  if (slug !== undefined) {
    assignments.push('slug = ?');
    values.push(slug);
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE products SET ${assignments.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    [...values, productId],
  );
  return result.affectedRows > 0;
};

export const softDelete = async (productId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE products SET status = 'INACTIVE', deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [productId],
  );
  return result.affectedRows > 0;
};

export const listVariants = async (productId: number): Promise<VariantRecord[]> => {
  const [rows] = await pool.execute<VariantRecord[]>(
    `SELECT ${VARIANT_COLUMNS} FROM product_variants
     WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [productId],
  );
  return rows;
};

export const findVariantById = async (variantId: number): Promise<VariantRecord | null> => {
  const [rows] = await pool.execute<VariantRecord[]>(
    `SELECT ${VARIANT_COLUMNS} FROM product_variants WHERE id = ? LIMIT 1`,
    [variantId],
  );
  return rows[0] ?? null;
};

export const createVariant = async (
  productId: number,
  input: CreateVariantInput,
  connection?: PoolConnection,
): Promise<number> => {
  const executor = connection ?? pool;
  const [result] = await executor.execute<ResultSetHeader>(
    `INSERT INTO product_variants
       (product_id, sku, variant_name, attributes, price, sale_price, stock, image_url, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      productId,
      input.sku,
      input.variantName,
      toJsonValue(input.attributes),
      input.price,
      input.salePrice ?? null,
      input.stock,
      input.imageUrl ?? null,
      input.sortOrder,
      input.status,
    ],
  );
  return result.insertId;
};

export const updateVariant = async (
  variantId: number,
  input: UpdateVariantInput,
  connection?: PoolConnection,
): Promise<boolean> => {
  const fieldMap: Record<string, string> = {
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
  const entries = Object.entries(input);
  const assignments = entries.map(([field]) => `${fieldMap[field]} = ?`);
  const values: Array<string | number | null> = entries.map(([field, value]) => {
    if (field === 'attributes') return toJsonValue(value);
    if (field === 'salePrice' || field === 'imageUrl') {
      return (value ?? null) as string | number | null;
    }
    return value as string | number | null;
  });
  const executor = connection ?? pool;
  const [result] = await executor.execute<ResultSetHeader>(
    `UPDATE product_variants SET ${assignments.join(', ')} WHERE id = ?`,
    [...values, variantId],
  );
  return result.affectedRows > 0;
};

export const deleteVariant = async (
  variantId: number,
  connection?: PoolConnection,
): Promise<boolean> => {
  const executor = connection ?? pool;
  const [result] = await executor.execute<ResultSetHeader>(
    'DELETE FROM product_variants WHERE id = ?',
    [variantId],
  );
  return result.affectedRows > 0;
};

export const syncProductStock = async (
  connection: PoolConnection,
  productId: number,
): Promise<void> => {
  await connection.execute(
    `UPDATE products p
     SET p.stock = (SELECT COALESCE(SUM(pv.stock), 0) FROM product_variants pv WHERE pv.product_id = ?),
         p.has_variants = 1
     WHERE p.id = ?`,
    [productId, productId],
  );
};

export const listImages = async (productId: number): Promise<ImageRecord[]> => {
  const [rows] = await pool.execute<ImageRecord[]>(
    `SELECT ${IMAGE_COLUMNS} FROM product_images
     WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [productId],
  );
  return rows;
};

export const findImageById = async (imageId: number): Promise<ImageRecord | null> => {
  const [rows] = await pool.execute<ImageRecord[]>(
    `SELECT ${IMAGE_COLUMNS} FROM product_images WHERE id = ? LIMIT 1`,
    [imageId],
  );
  return rows[0] ?? null;
};

export const clearPrimaryImage = async (
  connection: PoolConnection,
  productId: number,
): Promise<void> => {
  await connection.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
};

export const createImage = async (
  connection: PoolConnection,
  productId: number,
  input: CreateImageInput,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO product_images
       (product_id, variant_id, image_url, alt_text, is_primary, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      productId,
      input.variantId ?? null,
      input.imageUrl,
      input.altText ?? null,
      input.isPrimary ? 1 : 0,
      input.sortOrder,
    ],
  );
  return result.insertId;
};

export const setPrimaryImage = async (
  connection: PoolConnection,
  productId: number,
  imageId: number,
): Promise<boolean> => {
  await clearPrimaryImage(connection, productId);
  const [result] = await connection.execute<ResultSetHeader>(
    'UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?',
    [imageId, productId],
  );
  return result.affectedRows > 0;
};

export const deleteImage = async (imageId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM product_images WHERE id = ?',
    [imageId],
  );
  return result.affectedRows > 0;
};