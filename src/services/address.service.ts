import { withTransaction } from '../config/database';
import * as addressRepository from '../repositories/address.repository';
import { AppError } from '../utils/app-error';
import type { CreateAddressInput, UpdateAddressInput } from '../validators/address.validator';

const toAddressResponse = (address: addressRepository.AddressRecord) => ({
  id: address.id,
  receiverName: address.receiver_name,
  receiverPhone: address.receiver_phone,
  province: address.province,
  district: address.district,
  ward: address.ward,
  addressLine: address.address_line,
  addressType: address.address_type,
  isDefault: address.is_default === 1,
  createdAt: address.created_at,
  updatedAt: address.updated_at,
});

export const listAddresses = async (userId: number) =>
  (await addressRepository.listByUser(userId)).map(toAddressResponse);

export const createAddress = async (userId: number, input: CreateAddressInput) => {
  const addressId = await withTransaction(async (connection) => {
    if (input.isDefault) await addressRepository.clearDefault(connection, userId);
    return addressRepository.createAddress(connection, userId, input);
  });
  const address = await addressRepository.findOwnedById(userId, addressId);
  if (!address) throw new Error('Newly created address could not be loaded');
  return toAddressResponse(address);
};

export const updateAddress = async (userId: number, addressId: number, input: UpdateAddressInput) => {
  const updated = await addressRepository.updateOwnedAddress(userId, addressId, input);
  if (!updated) throw new AppError(404, 'Không tìm thấy địa chỉ');
  const address = await addressRepository.findOwnedById(userId, addressId);
  if (!address) throw new AppError(404, 'Không tìm thấy địa chỉ');
  return toAddressResponse(address);
};

export const deleteAddress = async (userId: number, addressId: number): Promise<void> => {
  if (!(await addressRepository.deleteOwnedAddress(userId, addressId))) {
    throw new AppError(404, 'Không tìm thấy địa chỉ');
  }
};

export const setDefaultAddress = async (userId: number, addressId: number) => {
  const address = await withTransaction(async (connection) => {
    const ownedAddress = await addressRepository.findOwnedById(userId, addressId, connection);
    if (!ownedAddress) throw new AppError(404, 'Không tìm thấy địa chỉ');
    await addressRepository.clearDefault(connection, userId);
    await addressRepository.setDefault(connection, userId, addressId);
    return { ...ownedAddress, is_default: 1 };
  });
  return toAddressResponse(address);
};
