import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeProcedure,pool } from '../config/database';
import type { UserRole } from '../types/auth';

export interface RefreshTokenRecord extends RowDataPacket {
  id: number;
  user_id: number;
  role: UserRole;
}

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
  await executeProcedure(connection, 'sp_auth_createrefreshtoken_1', [data.userId, data.tokenHash, data.userAgent, data.ipAddress, data.expiresAt]);
};

export const findUsableRefreshTokenForUpdate = async (
  connection: PoolConnection,
  tokenHash: string,
): Promise<RefreshTokenRecord | null> => {
  const [rows] = await executeProcedure<RefreshTokenRecord[]>(connection, 'sp_auth_findusablerefreshtokenforupdate_1', [tokenHash]);
  return rows[0] ?? null;
};

export const revokeRefreshTokenById = async (
  connection: PoolConnection,
  tokenId: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_auth_revokerefreshtokenbyid_1', [tokenId]);
};

export const revokeRefreshToken = async (
  userId: number,
  tokenHash: string,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(pool, 'sp_auth_revokerefreshtoken_1', [userId, tokenHash]);
  return result.affectedRows > 0;
};

export const revokeAllRefreshTokens = async (userId: number): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(pool, 'sp_auth_revokeallrefreshtokens_1', [userId]);
  return result.affectedRows;
};
