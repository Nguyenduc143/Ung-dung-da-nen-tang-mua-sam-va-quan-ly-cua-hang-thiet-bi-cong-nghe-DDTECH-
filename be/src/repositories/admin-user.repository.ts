import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeDynamicProcedure,executeProcedure,pool } from '../config/database';
import type { UserStatus } from '../types/auth';
import type { AdminUserQuery } from '../validators/user.validator';
import { UserProfileRecord } from './user.repository';

export interface CountRecord extends RowDataPacket {
  total: number;
}

export const PROFILE_COLUMNS = `id, full_name, email, phone, avatar_url, gender, date_of_birth,
  role, status, last_login_at, created_at, updated_at`;

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
  const [users] = await executeDynamicProcedure<UserProfileRecord[]>(pool, 'sp_dynamic_user_listusers_1', `SELECT ${PROFILE_COLUMNS} FROM users
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`, [...values, query.limit, offset]);
  const [countRows] = await executeDynamicProcedure<CountRecord[]>(pool, 'sp_dynamic_user_listusers_2', `SELECT COUNT(*) AS total FROM users WHERE ${where}`, values);

  return { users, total: countRows[0]?.total ?? 0 };
};

export const updateUserStatus = async (
  connection: PoolConnection,
  userId: number,
  status: UserStatus,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_user_updateuserstatus_1', [status, userId]);
  return result.affectedRows > 0;
};
