import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type { UserRole, UserStatus } from '../types/auth';

export interface UserRecord extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUserRecord extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ExistingIdentityRecord extends RowDataPacket {
  email: string;
  phone: string | null;
}

interface RefreshTokenRecord extends RowDataPacket {
  id: number;
  user_id: number;
  role: UserRole;
}

export const findExistingIdentity = async (
  email: string,
  phone: string,
): Promise<ExistingIdentityRecord | null> => {
  const [rows] = await pool.execute<ExistingIdentityRecord[]>(
    'SELECT email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1',
    [email, phone],
  );
  return rows[0] ?? null;
};

export const createCustomer = async (
  fullName: string,
  email: string,
  phone: string,
  passwordHash: string,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, 'CUSTOMER')`,
    [fullName, email, phone, passwordHash],
  );
  return result.insertId;
};

export const findUserForLogin = async (email: string): Promise<UserRecord | null> => {
  const [rows] = await pool.execute<UserRecord[]>(
    `SELECT id, full_name, email, phone, password_hash, avatar_url, role, status,
            deleted_at, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
};

export const findActiveUserById = async (userId: number): Promise<PublicUserRecord | null> => {
  const [rows] = await pool.execute<PublicUserRecord[]>(
    `SELECT id, full_name, email, phone, avatar_url, role, status, last_login_at,
            created_at, updated_at
     FROM users
     WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
};

export const updateLastLogin = async (
  userId: number,
  connection: PoolConnection,
): Promise<void> => {
  await connection.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
};

export const createRefreshToken = async (
  connection: PoolConnection,
  data: {
    userId: number;
    tokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  },
): Promise<void> => {
  await connection.execute(
    `INSERT INTO refresh_tokens
       (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [data.userId, data.tokenHash, data.userAgent, data.ipAddress, data.expiresAt],
  );
};

export const findUsableRefreshTokenForUpdate = async (
  connection: PoolConnection,
  tokenHash: string,
): Promise<RefreshTokenRecord | null> => {
  const [rows] = await connection.execute<RefreshTokenRecord[]>(
    `SELECT rt.id, rt.user_id, u.role
     FROM refresh_tokens rt
     INNER JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ?
       AND rt.revoked_at IS NULL
       AND rt.expires_at > CURRENT_TIMESTAMP
       AND u.status = 'ACTIVE'
       AND u.deleted_at IS NULL
     LIMIT 1
     FOR UPDATE`,
    [tokenHash],
  );
  return rows[0] ?? null;
};

export const revokeRefreshTokenById = async (
  connection: PoolConnection,
  tokenId: number,
): Promise<void> => {
  await connection.execute(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL',
    [tokenId],
  );
};

export const revokeRefreshToken = async (
  userId: number,
  tokenHash: string,
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL`,
    [userId, tokenHash],
  );
  return result.affectedRows > 0;
};

export const revokeAllRefreshTokens = async (userId: number): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND revoked_at IS NULL`,
    [userId],
  );
  return result.affectedRows;
};
