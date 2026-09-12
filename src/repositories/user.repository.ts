import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type { UserRole, UserStatus } from '../types/auth';
import type { AdminUserQuery, UpdateProfileInput } from '../validators/user.validator';

export interface UserProfileRecord extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  date_of_birth: Date | null;
  role: UserRole;
  status: UserStatus;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface PasswordRecord extends RowDataPacket {
  password_hash: string;
}

interface CountRecord extends RowDataPacket {
  total: number;
}

const PROFILE_COLUMNS = `id, full_name, email, phone, avatar_url, gender, date_of_birth,
  role, status, last_login_at, created_at, updated_at`;

export const findProfileById = async (userId: number): Promise<UserProfileRecord | null> => {
  const [rows] = await pool.execute<UserProfileRecord[]>(
    `SELECT ${PROFILE_COLUMNS}
     FROM users
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
};

export const findPasswordById = async (userId: number): Promise<PasswordRecord | null> => {
  const [rows] = await pool.execute<PasswordRecord[]>(
    `SELECT password_hash FROM users
     WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
};

export const phoneBelongsToAnotherUser = async (phone: string, userId: number): Promise<boolean> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1',
    [phone, userId],
  );
  return rows.length > 0;
};

export const updateProfile = async (userId: number, input: UpdateProfileInput): Promise<void> => {
  const fieldMap: Record<string, string> = {
    fullName: 'full_name',
    phone: 'phone',
    avatarUrl: 'avatar_url',
    gender: 'gender',
    dateOfBirth: 'date_of_birth',
  };
  const entries = Object.entries(input);
  const assignments = entries.map(([field]) => `${fieldMap[field]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  await pool.execute(
    `UPDATE users SET ${assignments} WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL`,
    [...values, userId],
  );
};

export const updatePassword = async (
  connection: PoolConnection,
  userId: number,
  passwordHash: string,
): Promise<void> => {
  await connection.execute(
    `UPDATE users SET password_hash = ?
     WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL`,
    [passwordHash, userId],
  );
};

export const listUsers = async (query: AdminUserQuery) => {
  const conditions = ['deleted_at IS NULL'];
  const values: Array<string | number> = [];

  if (query.search) {
    conditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    const search = `%${query.search}%`;
    values.push(search, search, search);
  }
  if (query.role) {
    conditions.push('role = ?');
    values.push(query.role);
  }
  if (query.status) {
    conditions.push('status = ?');
    values.push(query.status);
  }

  const where = conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [users] = await pool.execute<UserProfileRecord[]>(
    `SELECT ${PROFILE_COLUMNS} FROM users
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, query.limit, offset],
  );
  const [countRows] = await pool.execute<CountRecord[]>(
    `SELECT COUNT(*) AS total FROM users WHERE ${where}`,
    values,
  );

  return { users, total: countRows[0]?.total ?? 0 };
};

export const updateUserStatus = async (
  connection: PoolConnection,
  userId: number,
  status: UserStatus,
): Promise<boolean> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'UPDATE users SET status = ? WHERE id = ? AND deleted_at IS NULL',
    [status, userId],
  );
  return result.affectedRows > 0;
};

export const revokeUserTokens = async (
  connection: PoolConnection,
  userId: number,
): Promise<void> => {
  await connection.execute(
    `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND revoked_at IS NULL`,
    [userId],
  );
};
