import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeProcedure,pool } from '../config/database';
import type { UserRole,UserStatus } from '../types/auth';

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

export interface ExistingIdentityRecord extends RowDataPacket {
  email: string;
  phone: string | null;
}

export const findExistingIdentity = async (
  email: string,
  phone: string,
): Promise<ExistingIdentityRecord | null> => {
  const [rows] = await executeProcedure<ExistingIdentityRecord[]>(pool, 'sp_auth_findexistingidentity_1', [email, phone]);
  return rows[0] ?? null;
};

export const createCustomer = async (
  fullName: string,
  email: string,
  phone: string,
  passwordHash: string,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(pool, 'sp_auth_createcustomer_1', [fullName, email, phone, passwordHash]);
  return result.insertId;
};

export const findUserForLogin = async (email: string): Promise<UserRecord | null> => {
  const [rows] = await executeProcedure<UserRecord[]>(pool, 'sp_auth_finduserforlogin_1', [email]);
  return rows[0] ?? null;
};

export const findActiveUserById = async (userId: number): Promise<PublicUserRecord | null> => {
  const [rows] = await executeProcedure<PublicUserRecord[]>(pool, 'sp_auth_findactiveuserbyid_1', [userId]);
  return rows[0] ?? null;
};

export const updateLastLogin = async (
  userId: number,
  connection: PoolConnection,
): Promise<void> => {
  await executeProcedure(connection, 'sp_auth_updatelastlogin_1', [userId]);
};
