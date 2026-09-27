import { create } from 'zustand';

import * as addressesApi from '@/api/addresses.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import type { Address, CreateAddressInput, UpdateAddressInput } from '@/types';

interface AddressState {
  addresses: Address[];
  error: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  updatingAddressIds: Set<number>;
  loadAddresses: (force?: boolean) => Promise<Address[]>;
  refreshAddresses: () => Promise<Address[]>;
  createAddress: (input: CreateAddressInput) => Promise<Address>;
  updateAddress: (addressId: number, input: UpdateAddressInput) => Promise<Address>;
  removeAddress: (addressId: number) => Promise<void>;
  setDefaultAddress: (addressId: number) => Promise<Address>;
  resetAddresses: () => void;
}

let loadRequest: Promise<Address[]> | null = null;
let loadGeneration = 0;

const sortAddresses = (addresses: Address[]): Address[] => [...addresses].sort((left, right) => {
  if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
});

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  error: null,
  isInitialized: false,
  isLoading: false,
  isRefreshing: false,
  isSubmitting: false,
  updatingAddressIds: new Set<number>(),

  loadAddresses: async (force = false) => {
    if (!force && get().isInitialized) return get().addresses;
    if (loadRequest) return loadRequest;

    set(force
      ? { isRefreshing: true, error: null }
      : { isLoading: true, error: null });
    const requestGeneration = loadGeneration;
    const request = addressesApi.listAddresses()
      .then((addresses) => {
        if (requestGeneration === loadGeneration) {
          set({ addresses: sortAddresses(addresses), error: null, isInitialized: true });
        }
        return addresses;
      })
      .catch((error: unknown) => {
        if (requestGeneration === loadGeneration) {
          set({
            error: getApiErrorMessage(error, 'Không thể tải địa chỉ giao hàng.'),
            isInitialized: true,
          });
        }
        throw error;
      })
      .finally(() => {
        if (requestGeneration === loadGeneration) {
          set({ isLoading: false, isRefreshing: false });
        }
        if (loadRequest === request) loadRequest = null;
      });

    loadRequest = request;
    return request;
  },

  refreshAddresses: () => get().loadAddresses(true),

  createAddress: async (input) => {
    if (get().isSubmitting) throw new Error('Địa chỉ đang được lưu');
    const mutationGeneration = loadGeneration;
    set({ isSubmitting: true, error: null });
    try {
      const address = await addressesApi.createAddress(input);
      if (mutationGeneration === loadGeneration) {
        set((state) => ({
          addresses: sortAddresses([
            address,
            ...state.addresses
              .filter((item) => item.id !== address.id)
              .map((item) => input.isDefault ? { ...item, isDefault: false } : item),
          ]),
        }));
      }
      return address;
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể thêm địa chỉ.') });
      }
      throw error;
    } finally {
      if (mutationGeneration === loadGeneration) set({ isSubmitting: false });
    }
  },

  updateAddress: async (addressId, input) => {
    if (get().isSubmitting) throw new Error('Địa chỉ đang được lưu');
    const mutationGeneration = loadGeneration;
    set({ isSubmitting: true, error: null });
    try {
      const address = await addressesApi.updateAddress(addressId, input);
      if (mutationGeneration === loadGeneration) {
        set((state) => ({
          addresses: sortAddresses(state.addresses.map(
            (item) => item.id === addressId ? address : item,
          )),
        }));
      }
      return address;
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể cập nhật địa chỉ.') });
      }
      throw error;
    } finally {
      if (mutationGeneration === loadGeneration) set({ isSubmitting: false });
    }
  },

  removeAddress: async (addressId) => {
    if (get().updatingAddressIds.has(addressId)) return;
    const mutationGeneration = loadGeneration;
    set((state) => ({
      error: null,
      updatingAddressIds: new Set(state.updatingAddressIds).add(addressId),
    }));
    try {
      await addressesApi.removeAddress(addressId);
      if (mutationGeneration === loadGeneration) {
        set((state) => ({
          addresses: state.addresses.filter((item) => item.id !== addressId),
        }));
      }
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể xóa địa chỉ.') });
      }
      throw error;
    } finally {
      set((state) => {
        const updatingAddressIds = new Set(state.updatingAddressIds);
        updatingAddressIds.delete(addressId);
        return { updatingAddressIds };
      });
    }
  },

  setDefaultAddress: async (addressId) => {
    if (get().updatingAddressIds.has(addressId)) {
      const current = get().addresses.find((item) => item.id === addressId);
      if (current) return current;
    }
    const mutationGeneration = loadGeneration;
    set((state) => ({
      error: null,
      updatingAddressIds: new Set(state.updatingAddressIds).add(addressId),
    }));
    try {
      const address = await addressesApi.setDefaultAddress(addressId);
      if (mutationGeneration === loadGeneration) {
        set((state) => ({
          addresses: sortAddresses(state.addresses.map((item) => ({
            ...item,
            isDefault: item.id === addressId,
            updatedAt: item.id === addressId ? address.updatedAt : item.updatedAt,
          }))),
        }));
      }
      return address;
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể đặt địa chỉ mặc định.') });
      }
      throw error;
    } finally {
      set((state) => {
        const updatingAddressIds = new Set(state.updatingAddressIds);
        updatingAddressIds.delete(addressId);
        return { updatingAddressIds };
      });
    }
  },

  resetAddresses: () => {
    loadGeneration += 1;
    loadRequest = null;
    set({
      addresses: [],
      error: null,
      isInitialized: false,
      isLoading: false,
      isRefreshing: false,
      isSubmitting: false,
      updatingAddressIds: new Set<number>(),
    });
  },
}));
