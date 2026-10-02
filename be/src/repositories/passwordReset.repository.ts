import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { executeProcedure, pool } from '../config/database';
import type { UserStatus } from '../types/auth';

export interface PasswordResetUserRecord extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  status: UserStatus;
  deleted_at: Date | null;
}

export interface PasswordResetCodeRecord extends RowDataPacket {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  used_at: Date | null;
  attempts: number;
}

export const findUserByEmail = async (email: string): Promise<PasswordResetUserRecord | null> => {
  const [rows] = await executeProcedure<PasswordResetUserRecord[]>(
    pool,
    'sp_passwordreset_finduserbyemail_1',
    [email],
  );
  return rows[0] ?? null;
};

export const invalidateCodes = async (connection: PoolConnection, userId: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_passwordreset_invalidatecodes_1', [userId]);
};

export const createCode = async (
  connection: PoolConnection,
  userId: number,
  codeHash: string,
  expiresAt: Date,
): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_passwordreset_createcode_1', [
    userId,
    codeHash,
    expiresAt,
  ]);
};

export const findLatestForUpdate = async (
  connection: PoolConnection,
  userId: number,
): Promise<PasswordResetCodeRecord | null> => {
  const [rows] = await executeProcedure<PasswordResetCodeRecord[]>(
    connection,
    'sp_passwordreset_findlatestforupdate_1',
    [userId],
  );
  return rows[0] ?? null;
};

export const incrementAttempts = async (connection: PoolConnection, id: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_passwordreset_incrementattempts_1', [id]);
};

export const markUsed = async (connection: PoolConnection, id: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_passwordreset_markused_1', [id]);
};
