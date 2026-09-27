import { create } from 'zustand';

import * as cartApi from '@/api/cart.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import type { AddCartItemInput, CartData } from '@/types';
import { useBadgeStore } from './badgeStore';

interface CartState {
  cart: CartData | null;
  error: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isClearing: boolean;
  isSelectionInitialized: boolean;
  selectedItemIds: Set<number>;
  updatingItemIds: Set<number>;
  loadCart: (force?: boolean) => Promise<CartData>;
  refreshCart: () => Promise<CartData>;
  addItem: (input: AddCartItemInput) => Promise<CartData>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<CartData>;
  removeItem: (itemId: number) => Promise<CartData>;
  clearItems: () => Promise<CartData>;
  toggleItemSelection: (itemId: number) => void;
  setAllItemsSelected: (selected: boolean) => void;
  resetCart: () => void;
}

let loadRequest: Promise<CartData> | null = null;
let loadGeneration = 0;

const applyCart = (cart: CartData, expectedGeneration = loadGeneration): void => {
  if (expectedGeneration !== loadGeneration) return;
  const state = useCartStore.getState();
  const previousItemIds = new Set(state.cart?.items.map((item) => item.id) ?? []);
  const currentItemIds = new Set(cart.items.map((item) => item.id));
  const selectedItemIds = state.isSelectionInitialized
    ? new Set(cart.items
      .filter((item) => (
        state.selectedItemIds.has(item.id) || !previousItemIds.has(item.id)
      ))
      .map((item) => item.id))
    : currentItemIds;
  useBadgeStore.getState().setCartItemCount(cart.summary.totalItems);
  useCartStore.setState({
    cart,
    error: null,
    isInitialized: true,
    isSelectionInitialized: true,
    selectedItemIds,
  });
};

const loadLatestCart = async (expectedGeneration: number): Promise<CartData> => {
  const cart = await cartApi.getCart();
  applyCart(cart, expectedGeneration);
  return cart;
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  error: null,
  isInitialized: false,
  isLoading: false,
  isRefreshing: false,
  isClearing: false,
  isSelectionInitialized: false,
  selectedItemIds: new Set<number>(),
  updatingItemIds: new Set<number>(),

  loadCart: async (force = false) => {
    if (!force && get().isInitialized && get().cart) return get().cart!;
    if (loadRequest) return loadRequest;

    set(force
      ? { isRefreshing: true, error: null }
      : { isLoading: true, error: null });
    const requestGeneration = loadGeneration;
    const request = cartApi.getCart()
      .then((cart) => {
        applyCart(cart, requestGeneration);
        return cart;
      })
      .catch((error: unknown) => {
        if (requestGeneration === loadGeneration) {
          set({
            error: getApiErrorMessage(error, 'Không thể tải giỏ hàng.'),
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

  refreshCart: () => get().loadCart(true),

  addItem: async (input) => {
    const mutationGeneration = loadGeneration;
    try {
      const cart = await cartApi.addCartItem(input);
      applyCart(cart, mutationGeneration);
      return cart;
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể thêm sản phẩm vào giỏ.') });
      }
      throw error;
    }
  },

  updateItemQuantity: async (itemId, quantity) => {
    if (get().updatingItemIds.has(itemId)) {
      return get().cart ?? get().loadCart(true);
    }
    const mutationGeneration = loadGeneration;
    set((state) => ({
      error: null,
      updatingItemIds: new Set(state.updatingItemIds).add(itemId),
    }));

    try {
      const cart = await cartApi.updateCartItem(itemId, { quantity });
      applyCart(cart, mutationGeneration);
      return cart;
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể cập nhật số lượng.') });
      }
      throw error;
    } finally {
      set((state) => {
        const updatingItemIds = new Set(state.updatingItemIds);
        updatingItemIds.delete(itemId);
        return { updatingItemIds };
      });
    }
  },

  removeItem: async (itemId) => {
    if (get().updatingItemIds.has(itemId)) {
      return get().cart ?? get().loadCart(true);
    }
    const mutationGeneration = loadGeneration;
    set((state) => ({
      error: null,
      updatingItemIds: new Set(state.updatingItemIds).add(itemId),
    }));

    try {
      await cartApi.removeCartItem(itemId);
      return await loadLatestCart(mutationGeneration);
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể xóa sản phẩm khỏi giỏ.') });
      }
      throw error;
    } finally {
      set((state) => {
        const updatingItemIds = new Set(state.updatingItemIds);
        updatingItemIds.delete(itemId);
        return { updatingItemIds };
      });
    }
  },

  clearItems: async () => {
    if (get().isClearing) return get().cart ?? get().loadCart(true);
    const mutationGeneration = loadGeneration;
    set({ isClearing: true, error: null });

    try {
      await cartApi.clearCart();
      return await loadLatestCart(mutationGeneration);
    } catch (error) {
      if (mutationGeneration === loadGeneration) {
        set({ error: getApiErrorMessage(error, 'Không thể xóa toàn bộ giỏ hàng.') });
      }
      throw error;
    } finally {
      set({ isClearing: false });
    }
  },

  toggleItemSelection: (itemId) => {
    if (!get().cart?.items.some((item) => item.id === itemId)) return;
    set((state) => {
      const selectedItemIds = new Set(state.selectedItemIds);
      if (selectedItemIds.has(itemId)) selectedItemIds.delete(itemId);
      else selectedItemIds.add(itemId);
      return { selectedItemIds, isSelectionInitialized: true };
    });
  },

  setAllItemsSelected: (selected) => {
    set((state) => ({
      isSelectionInitialized: true,
      selectedItemIds: selected
        ? new Set(state.cart?.items.map((item) => item.id) ?? [])
        : new Set<number>(),
    }));
  },

  resetCart: () => {
    loadGeneration += 1;
    loadRequest = null;
    useBadgeStore.getState().setCartItemCount(0);
    set({
      cart: null,
      error: null,
      isInitialized: false,
      isLoading: false,
      isRefreshing: false,
      isClearing: false,
      isSelectionInitialized: false,
      selectedItemIds: new Set<number>(),
      updatingItemIds: new Set<number>(),
    });
  },
}));
