import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';
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

export const listByUser = async (userId: number): Promise<AddressRecord[]> => {
  const [rows] = await executeProcedure<AddressRecord[]>(pool, 'sp_address_listbyuser_1', [userId]);
  return rows;
};

export const findOwnedById = async (
  userId: number,
  addressId: number,
  connection?: PoolConnection,
): Promise<AddressRecord | null> => {
  const executor = connection ?? pool;
  const [rows] = await executeProcedure<AddressRecord[]>(executor, 'sp_address_findownedbyid_1', [addressId, userId]);
  return rows[0] ?? null;
};

export const clearDefault = async (
  connection: PoolConnection,
  userId: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_address_cleardefault_1', [
    userId,
  ]);
};

export const createAddress = async (
  connection: PoolConnection,
  userId: number,
  input: CreateAddressInput,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_address_createaddress_1', [
      userId,
      input.receiverName,
      input.receiverPhone,
      input.province,
      input.district,
      input.ward ?? null,
      input.addressLine,
      input.addressType,
      input.isDefault ? 1 : 0,
    ]);
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
  const [result] = await executeDynamicProcedure<ResultSetHeader>(pool, 'sp_dynamic_address_updateownedaddress_1', `UPDATE addresses SET ${assignments} WHERE id = ? AND user_id = ?`, [...values, addressId, userId]);
  return result.affectedRows > 0;
};

export const deleteOwnedAddress = async (userId: number, addressId: number): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(pool, 'sp_address_deleteownedaddress_1', [addressId, userId]);
  return result.affectedRows > 0;
};

export const setDefault = async (
  connection: PoolConnection,
  userId: number,
  addressId: number,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_address_setdefault_1', [addressId, userId]);
  return result.affectedRows > 0;
};
