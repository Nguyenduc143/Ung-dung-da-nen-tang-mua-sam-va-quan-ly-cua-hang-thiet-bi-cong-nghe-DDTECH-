import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { ExecuteValues } from 'mysql2';
import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';

export type CatalogKind = 'categories' | 'brands' | 'category_attributes';
type Executor = typeof pool | PoolConnection;
export type CatalogRow = RowDataPacket & { id: number; parentId?: number | null; categoryId?: number };
// Only these server-owned identifiers may enter SQL. All values use placeholders.
const fields = {
  categories: { name: 'name', slug: 'slug', parentId: 'parent_id', description: 'description', imageUrl: 'image_url', sortOrder: 'sort_order', status: 'status' },
  brands: { name: 'name', slug: 'slug', description: 'description', logoUrl: 'logo_url', status: 'status' },
  category_attributes: { categoryId: 'category_id', attrKey: 'attr_key', attrName: 'attr_name', unit: 'unit', inputType: 'input_type', options: 'options', isFilterable: 'is_filterable', sortOrder: 'sort_order' },
};
function columns(kind: CatalogKind) {
  return ['id', ...Object.entries(fields[kind]).map(([key, column]) => `\`${column}\` AS \`${key}\``),
    'created_at AS createdAt', 'updated_at AS updatedAt'].join(', ');
}
export async function list(kind: CatalogKind, publicOnly: boolean, categoryId?: number, db: Executor = pool) {
  const where = kind === 'category_attributes' ? 'category_id = ?' :
    "deleted_at IS NULL" + (publicOnly ? " AND status = 'ACTIVE'" : '');
  const [rows] = await executeDynamicProcedure<CatalogRow[]>(db, 'sp_dynamic_catalog_list_1', `SELECT ${columns(kind)} FROM ${kind} WHERE ${where} ORDER BY ${kind === 'brands' ? 'name' : 'sort_order'}, id`, kind === 'category_attributes' ? [categoryId!] : []);
  return rows;
}
export async function find(kind: CatalogKind, key: number | string, publicOnly = false, db: Executor = pool) {
  const where = typeof key === 'number' ? 'id = ?' : 'slug = ?';
  const visible = kind === 'category_attributes' ? '' : " AND deleted_at IS NULL" + (publicOnly ? " AND status = 'ACTIVE'" : '');
  const [rows] = await executeDynamicProcedure<CatalogRow[]>(db, 'sp_dynamic_catalog_find_1', `SELECT ${columns(kind)} FROM ${kind} WHERE ${where}${visible}`, [key]);
  return rows[0] ?? null;
}

export async function listBrandsForCategory(category: string, includeDescendants: boolean) {
  const numericId = /^\d+$/.test(category);
  const rootCondition = numericId ? 'id = ?' : 'slug = ?';
  const categoryCondition = includeDescendants
    ? `p.category_id IN (
        WITH RECURSIVE category_tree AS (
          SELECT id FROM categories WHERE ${rootCondition} AND deleted_at IS NULL AND status = 'ACTIVE'
          UNION ALL
          SELECT child.id FROM categories child
          INNER JOIN category_tree parent ON child.parent_id = parent.id
          WHERE child.deleted_at IS NULL AND child.status = 'ACTIVE'
        ) SELECT id FROM category_tree
      )`
    : `p.category_id IN (SELECT id FROM categories WHERE ${rootCondition} AND deleted_at IS NULL AND status = 'ACTIVE')`;
  const [rows] = await executeDynamicProcedure<CatalogRow[]>(pool, 'sp_dynamic_catalog_list_1', `
    SELECT b.id, b.name, b.slug, b.description, b.logo_url AS logoUrl, b.status,
           b.created_at AS createdAt, b.updated_at AS updatedAt
    FROM brands b
    WHERE b.deleted_at IS NULL AND b.status = 'ACTIVE'
      AND EXISTS (
        SELECT 1 FROM products p
        WHERE p.brand_id = b.id AND p.deleted_at IS NULL AND p.status = 'ACTIVE'
          AND ${categoryCondition}
      )
    ORDER BY b.name, b.id`, [numericId ? Number(category) : category]);
  return rows;
}
export async function save(kind: CatalogKind, data: Record<string, unknown>, id: number | undefined, db: Executor) {
  const map: Record<string, string> = fields[kind];
  const entries = Object.entries(data).filter(([key, value]) => key in map && value !== undefined);
  const values = entries.map(([key, value]) => key === 'options' && value !== null ? JSON.stringify(value) : value) as ExecuteValues[];
  const sql = id === undefined
    ? `INSERT INTO ${kind} (${entries.map(([key]) => `\`${map[key]}\``).join(',')}) VALUES (${entries.map(() => '?').join(',')})`
    : `UPDATE ${kind} SET ${entries.map(([key]) => `\`${map[key]}\` = ?`).join(',')} WHERE id = ?`;
  const [result] = await executeDynamicProcedure<ResultSetHeader>(db, 'sp_dynamic_catalog_save_1', sql, id === undefined ? values : [...values, id]);
  return id ?? result.insertId;
}
export async function remove(kind: CatalogKind, id: number, db: Executor) {
  await executeDynamicProcedure(db, 'sp_dynamic_catalog_remove_1', kind === 'category_attributes' ? 'DELETE FROM category_attributes WHERE id = ?' :
    `UPDATE ${kind} SET deleted_at = CURRENT_TIMESTAMP, status = 'HIDDEN' WHERE id = ?`, [id]);
}
export async function lockTree(db: PoolConnection) {
  // Serialize category mutations, including two concurrent reparent requests.
  const [rows] = await executeProcedure<CatalogRow[]>(db, 'sp_catalog_locktree_1', []);
  return rows;
}
export async function lockRecord(kind: CatalogKind, id: number, db: PoolConnection) {
  await executeDynamicProcedure(db, 'sp_dynamic_catalog_lockrecord_1', `SELECT id FROM ${kind} WHERE id = ? FOR UPDATE`, [id]);
}
