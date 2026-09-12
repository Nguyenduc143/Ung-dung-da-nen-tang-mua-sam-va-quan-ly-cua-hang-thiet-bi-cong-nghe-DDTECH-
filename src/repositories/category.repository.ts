import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type {
  CreateCategoryAttributeInput,
  CreateCategoryInput,
  UpdateCategoryAttributeInput,
  UpdateCategoryInput,
} from '../validators/catalog.validator';

export interface CategoryRecord extends RowDataPacket {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  status: 'ACTIVE' | 'HIDDEN';
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryAttributeRecord extends RowDataPacket {
  id: number;
  category_id: number;
  attr_key: string;
  attr_name: string;
  unit: string | null;
  input_type: 'TEXT' | 'NUMBER' | 'SELECT';
  options: unknown;
  is_filterable: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const CATEGORY_COLUMNS = `id, parent_id, name, slug, description, image_url, sort_order,
  status, deleted_at, created_at, updated_at`;
const ATTRIBUTE_COLUMNS = `id, category_id, attr_key, attr_name, unit, input_type, options,
  is_filterable, sort_order, created_at, updated_at`;

export const listPublic = async (): Promise<CategoryRecord[]> => {
  const [rows] = await pool.execute<CategoryRecord[]>(
    `SELECT ${CATEGORY_COLUMNS} FROM categories
     WHERE status = 'ACTIVE' AND deleted_at IS NULL
     ORDER BY sort_order ASC, name ASC`,
  );
  return rows;
};

export const findPublicBySlug = async (slug: string): Promise<CategoryRecord | null> => {
  const [rows] = await pool.execute<CategoryRecord[]>(
    `SELECT ${CATEGORY_COLUMNS} FROM categories
     WHERE slug = ? AND status = 'ACTIVE' AND deleted_at IS NULL
     LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
};

export const listAdmin = async (): Promise<CategoryRecord[]> => {
  const [rows] = await pool.execute<CategoryRecord[]>(
    `SELECT ${CATEGORY_COLUMNS} FROM categories
     ORDER BY deleted_at IS NOT NULL ASC, sort_order ASC, name ASC`,
  );
  return rows;
};

export const findById = async (categoryId: number): Promise<CategoryRecord | null> => {
  const [rows] = await pool.execute<CategoryRecord[]>(
    `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE id = ? LIMIT 1`,
    [categoryId],
  );
  return rows[0] ?? null;
};

export const create = async (input: CreateCategoryInput, slug: string): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO categories
       (parent_id, name, slug, description, image_url, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.parentId ?? null,
      input.name,
      slug,
      input.description ?? null,
      input.imageUrl ?? null,
      input.sortOrder,
      input.status,
    ],
  );
  return result.insertId;
};

export const update = async (
  categoryId: number,
  input: UpdateCategoryInput,
  slug?: string,
): Promise<boolean> => {
  const fieldMap: Record<string, string> = {
    parentId: 'parent_id',
    name: 'name',
    description: 'description',
    imageUrl: 'image_url',
    sortOrder: 'sort_order',
    status: 'status',
  };
  const entries = Object.entries(input).filter(([field]) => field !== 'slug');
  const assignments = entries.map(([field]) => `${fieldMap[field]} = ?`);
  const values = entries.map(([, value]) => value ?? null);

  if (slug !== undefined) {
    assignments.push('slug = ?');
    values.push(slug);
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE categories SET ${assignments.join(', ')}
     WHERE id = ? AND deleted_at IS NULL`,
    [...values, categoryId],
  );
  return result.affectedRows > 0;
};

export const softDelete = async (categoryId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE categories SET status = 'HIDDEN', deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [categoryId],
  );
  return result.affectedRows > 0;
};

export const listAttributes = async (categoryId: number): Promise<CategoryAttributeRecord[]> => {
  const [rows] = await pool.execute<CategoryAttributeRecord[]>(
    `SELECT ${ATTRIBUTE_COLUMNS} FROM category_attributes
     WHERE category_id = ? ORDER BY sort_order ASC, attr_name ASC`,
    [categoryId],
  );
  return rows;
};

export const findAttributeById = async (
  attributeId: number,
): Promise<CategoryAttributeRecord | null> => {
  const [rows] = await pool.execute<CategoryAttributeRecord[]>(
    `SELECT ${ATTRIBUTE_COLUMNS} FROM category_attributes WHERE id = ? LIMIT 1`,
    [attributeId],
  );
  return rows[0] ?? null;
};

export const createAttribute = async (
  categoryId: number,
  input: CreateCategoryAttributeInput,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO category_attributes
       (category_id, attr_key, attr_name, unit, input_type, options, is_filterable, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      input.attrKey,
      input.attrName,
      input.unit ?? null,
      input.inputType,
      input.options === undefined || input.options === null ? null : JSON.stringify(input.options),
      input.isFilterable ? 1 : 0,
      input.sortOrder,
    ],
  );
  return result.insertId;
};

export const updateAttribute = async (
  attributeId: number,
  input: UpdateCategoryAttributeInput,
): Promise<boolean> => {
  const fieldMap: Record<string, string> = {
    attrKey: 'attr_key',
    attrName: 'attr_name',
    unit: 'unit',
    inputType: 'input_type',
    options: 'options',
    isFilterable: 'is_filterable',
    sortOrder: 'sort_order',
  };
  const entries = Object.entries(input);
  const assignments = entries.map(([field]) => `${fieldMap[field]} = ?`);
  const values: Array<string | number | null> = entries.map(([field, value]) => {
    if (field === 'options') return value === null ? null : JSON.stringify(value);
    if (field === 'isFilterable') return value ? 1 : 0;
    return value as string | number | null;
  });

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE category_attributes SET ${assignments.join(', ')} WHERE id = ?`,
    [...values, attributeId],
  );
  return result.affectedRows > 0;
};

export const deleteAttribute = async (attributeId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM category_attributes WHERE id = ?',
    [attributeId],
  );
  return result.affectedRows > 0;
};