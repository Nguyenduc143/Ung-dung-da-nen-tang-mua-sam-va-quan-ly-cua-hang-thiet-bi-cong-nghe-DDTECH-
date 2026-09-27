import type {
  Address,
  ApiResponse,
  CreateAddressInput,
  UpdateAddressInput,
} from '@/types';
import { apiClient } from './axiosClient';

export const listAddresses = async (): Promise<Address[]> => {
  const response = await apiClient.get<ApiResponse<{ addresses: Address[] }>>('/addresses');
  return response.data.data.addresses;
};

export const createAddress = async (input: CreateAddressInput): Promise<Address> => {
  const response = await apiClient.post<ApiResponse<{ address: Address }>>('/addresses', input);
  return response.data.data.address;
};

export const updateAddress = async (
  addressId: number,
  input: UpdateAddressInput,
): Promise<Address> => {
  const response = await apiClient.patch<ApiResponse<{ address: Address }>>(
    `/addresses/${addressId}`,
    input,
  );
  return response.data.data.address;
};

export const removeAddress = async (addressId: number): Promise<void> => {
  await apiClient.delete(`/addresses/${addressId}`);
};

export const setDefaultAddress = async (addressId: number): Promise<Address> => {
  const response = await apiClient.patch<ApiResponse<{ address: Address }>>(
    `/addresses/${addressId}/default`,
  );
  return response.data.data.address;
};
