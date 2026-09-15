import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { ExecuteValues } from 'mysql2';
import { pool } from '../config/database';

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
  const [rows] = await db.execute<CatalogRow[]>(
    `SELECT ${columns(kind)} FROM ${kind} WHERE ${where} ORDER BY ${kind === 'brands' ? 'name' : 'sort_order'}, id`,
    kind === 'category_attributes' ? [categoryId!] : [],
  );
  return rows;
}
export async function find(kind: CatalogKind, key: number | string, publicOnly = false, db: Executor = pool) {
  const where = typeof key === 'number' ? 'id = ?' : 'slug = ?';
  const visible = kind === 'category_attributes' ? '' : " AND deleted_at IS NULL" + (publicOnly ? " AND status = 'ACTIVE'" : '');
  const [rows] = await db.execute<CatalogRow[]>(`SELECT ${columns(kind)} FROM ${kind} WHERE ${where}${visible}`, [key]);
  return rows[0] ?? null;
}
export async function save(kind: CatalogKind, data: Record<string, unknown>, id: number | undefined, db: Executor) {
  const map: Record<string, string> = fields[kind];
  const entries = Object.entries(data).filter(([key, value]) => key in map && value !== undefined);
  const values = entries.map(([key, value]) => key === 'options' && value !== null ? JSON.stringify(value) : value) as ExecuteValues[];
  const sql = id === undefined
    ? `INSERT INTO ${kind} (${entries.map(([key]) => `\`${map[key]}\``).join(',')}) VALUES (${entries.map(() => '?').join(',')})`
    : `UPDATE ${kind} SET ${entries.map(([key]) => `\`${map[key]}\` = ?`).join(',')} WHERE id = ?`;
  const [result] = await db.execute<ResultSetHeader>(sql, id === undefined ? values : [...values, id]);
  return id ?? result.insertId;
}
export async function remove(kind: CatalogKind, id: number, db: Executor) {
  await db.execute(kind === 'category_attributes' ? 'DELETE FROM category_attributes WHERE id = ?' :
    `UPDATE ${kind} SET deleted_at = CURRENT_TIMESTAMP, status = 'HIDDEN' WHERE id = ?`, [id]);
}
export async function lockTree(db: PoolConnection) {
  // Serialize category mutations, including two concurrent reparent requests.
  const [rows] = await db.execute<CatalogRow[]>('SELECT id, parent_id AS parentId, deleted_at AS deletedAt FROM categories ORDER BY id FOR UPDATE');
  return rows;
}
export async function lockRecord(kind: CatalogKind, id: number, db: PoolConnection) {
  await db.execute(`SELECT id FROM ${kind} WHERE id = ? FOR UPDATE`, [id]);
}
