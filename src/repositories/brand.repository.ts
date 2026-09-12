import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type { CreateBrandInput, UpdateBrandInput } from '../validators/catalog.validator';

export interface BrandRecord extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  status: 'ACTIVE' | 'HIDDEN';
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const BRAND_COLUMNS = `id, name, slug, logo_url, description, status, deleted_at,
  created_at, updated_at`;

export const listPublic = async (): Promise<BrandRecord[]> => {
  const [rows] = await pool.execute<BrandRecord[]>(
    `SELECT ${BRAND_COLUMNS} FROM brands
     WHERE status = 'ACTIVE' AND deleted_at IS NULL ORDER BY name ASC`,
  );
  return rows;
};

export const findPublicBySlug = async (slug: string): Promise<BrandRecord | null> => {
  const [rows] = await pool.execute<BrandRecord[]>(
    `SELECT ${BRAND_COLUMNS} FROM brands
     WHERE slug = ? AND status = 'ACTIVE' AND deleted_at IS NULL LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
};

export const listAdmin = async (): Promise<BrandRecord[]> => {
  const [rows] = await pool.execute<BrandRecord[]>(
    `SELECT ${BRAND_COLUMNS} FROM brands
     ORDER BY deleted_at IS NOT NULL ASC, name ASC`,
  );
  return rows;
};

export const findById = async (brandId: number): Promise<BrandRecord | null> => {
  const [rows] = await pool.execute<BrandRecord[]>(
    `SELECT ${BRAND_COLUMNS} FROM brands WHERE id = ? LIMIT 1`,
    [brandId],
  );
  return rows[0] ?? null;
};

export const create = async (input: CreateBrandInput, slug: string): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO brands (name, slug, logo_url, description, status)
     VALUES (?, ?, ?, ?, ?)`,
    [input.name, slug, input.logoUrl ?? null, input.description ?? null, input.status],
  );
  return result.insertId;
};

export const update = async (
  brandId: number,
  input: UpdateBrandInput,
  slug?: string,
): Promise<boolean> => {
  const fieldMap: Record<string, string> = {
    name: 'name',
    logoUrl: 'logo_url',
    description: 'description',
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
    `UPDATE brands SET ${assignments.join(', ')}
     WHERE id = ? AND deleted_at IS NULL`,
    [...values, brandId],
  );
  return result.affectedRows > 0;
};

export const softDelete = async (brandId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE brands SET status = 'HIDDEN', deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [brandId],
  );
  return result.affectedRows > 0;
};