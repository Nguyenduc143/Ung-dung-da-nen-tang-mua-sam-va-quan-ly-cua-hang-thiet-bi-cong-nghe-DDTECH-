import type { ExecuteValues } from 'mysql2';
import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeDynamicProcedure,executeProcedure,pool } from '../config/database';
import type {
CreateProductInput,
ProductQuery,
UpdateProductInput
} from '../validators/product.validator';
import { Executor,toDatabaseValue } from './product.shared';

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

export interface CatalogReferenceRecord extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
}

export interface CountRecord extends RowDataPacket {
  total: number;
}

export const PRODUCT_COLUMNS = `p.id, p.category_id AS categoryId, p.brand_id AS brandId,
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

export const productFields: Record<string, string> = {
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

export const listProducts = async (query: ProductQuery, publicOnly = true) => {
  const conditions = ['p.deleted_at IS NULL'];
  const values: Array<string | number> = [];

  if (publicOnly) {
    conditions.push("p.status = 'ACTIVE'");
  } else if (query.status) {
    conditions.push('p.status = ?');
    values.push(query.status);
  }

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
