import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { executeProcedure, pool } from '../config/database';
import type { UserStatus } from '../types/auth';

export interface VerificationUserRecord extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  status: UserStatus;
  email_verified_at: Date | null;
  deleted_at: Date | null;
}

export interface VerificationCodeRecord extends RowDataPacket {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  used_at: Date | null;
  attempts: number;
}

export const findUserByEmail = async (email: string): Promise<VerificationUserRecord | null> => {
  const [rows] = await executeProcedure<VerificationUserRecord[]>(
    pool,
    'sp_emailverification_finduserbyemail_1',
    [email],
  );
  return rows[0] ?? null;
};

export const invalidateCodes = async (connection: PoolConnection, userId: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_emailverification_invalidatecodes_1', [userId]);
};

export const createCode = async (
  connection: PoolConnection,
  userId: number,
  codeHash: string,
  expiresAt: Date,
): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_emailverification_createcode_1', [
    userId,
    codeHash,
    expiresAt,
  ]);
};

export const findLatestForUpdate = async (
  connection: PoolConnection,
  userId: number,
): Promise<VerificationCodeRecord | null> => {
  const [rows] = await executeProcedure<VerificationCodeRecord[]>(
    connection,
    'sp_emailverification_findlatestforupdate_1',
    [userId],
  );
  return rows[0] ?? null;
};

export const incrementAttempts = async (connection: PoolConnection, id: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_emailverification_incrementattempts_1', [id]);
};

export const markUsed = async (connection: PoolConnection, id: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_emailverification_markused_1', [id]);
};

export const verifyUser = async (connection: PoolConnection, userId: number): Promise<void> => {
  await executeProcedure<ResultSetHeader>(connection, 'sp_emailverification_verifyuser_1', [userId]);
};
