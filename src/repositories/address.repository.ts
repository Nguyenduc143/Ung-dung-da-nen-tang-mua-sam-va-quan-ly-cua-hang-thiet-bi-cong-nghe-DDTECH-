import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type { CreateAddressInput, UpdateAddressInput } from '../validators/address.validator';

export interface AddressRecord extends RowDataPacket {
  id: number;
  user_id: number;
  receiver_name: string;
  receiver_phone: string;
  province: string;
  district: string;
  ward: string | null;
  address_line: string;
  address_type: 'HOME' | 'OFFICE' | 'OTHER';
  is_default: number;
  created_at: Date;
  updated_at: Date;
}

const ADDRESS_COLUMNS = `id, user_id, receiver_name, receiver_phone, province, district,
  ward, address_line, address_type, is_default, created_at, updated_at`;

export const listByUser = async (userId: number): Promise<AddressRecord[]> => {
  const [rows] = await pool.execute<AddressRecord[]>(
    `SELECT ${ADDRESS_COLUMNS} FROM addresses
     WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return rows;
};

export const findOwnedById = async (
  userId: number,
  addressId: number,
  connection?: PoolConnection,
): Promise<AddressRecord | null> => {
  const executor = connection ?? pool;
  const [rows] = await executor.execute<AddressRecord[]>(
    `SELECT ${ADDRESS_COLUMNS} FROM addresses
     WHERE id = ? AND user_id = ? LIMIT 1`,
    [addressId, userId],
  );
  return rows[0] ?? null;
};

export const clearDefault = async (
  connection: PoolConnection,
  userId: number,
): Promise<void> => {
  await connection.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND is_default = 1', [
    userId,
  ]);
};

export const createAddress = async (
  connection: PoolConnection,
  userId: number,
  input: CreateAddressInput,
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO addresses
       (user_id, receiver_name, receiver_phone, province, district, ward,
        address_line, address_type, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.receiverName,
      input.receiverPhone,
      input.province,
      input.district,
      input.ward ?? null,
      input.addressLine,
      input.addressType,
      input.isDefault ? 1 : 0,
    ],
  );
  return result.insertId;
};

export const updateOwnedAddress = async (
  userId: number,
  addressId: number,
  input: UpdateAddressInput,
): Promise<boolean> => {
  const fieldMap: Record<string, string> = {
    receiverName: 'receiver_name',
    receiverPhone: 'receiver_phone',
    province: 'province',
    district: 'district',
    ward: 'ward',
    addressLine: 'address_line',
    addressType: 'address_type',
  };
  const entries = Object.entries(input);
  const assignments = entries.map(([field]) => `${fieldMap[field]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE addresses SET ${assignments} WHERE id = ? AND user_id = ?`,
    [...values, addressId, userId],
  );
  return result.affectedRows > 0;
};

export const deleteOwnedAddress = async (userId: number, addressId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM addresses WHERE id = ? AND user_id = ?',
    [addressId, userId],
  );
  return result.affectedRows > 0;
};

export const setDefault = async (
  connection: PoolConnection,
  userId: number,
  addressId: number,
): Promise<boolean> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
    [addressId, userId],
  );
  return result.affectedRows > 0;
};
