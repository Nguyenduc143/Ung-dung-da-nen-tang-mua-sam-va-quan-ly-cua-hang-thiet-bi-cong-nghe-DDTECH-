import { create } from 'zustand';

import { getApiErrorMessage } from '@/api/axiosClient';
import * as favoritesApi from '@/api/favorites.api';
import type { FavoriteItem } from '@/types';

interface FavoriteState {
  favorites: FavoriteItem[];
  error: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  updatingProductIds: Set<number>;
  loadFavorites: (force?: boolean) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (productId: number) => Promise<boolean>;
  resetFavorites: () => void;
}

let loadRequest: Promise<void> | null = null;
let loadGeneration = 0;

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  error: null,
  isInitialized: false,
  isLoading: false,
  isRefreshing: false,
  updatingProductIds: new Set<number>(),

  loadFavorites: async (force = false) => {
    if (!force && get().isInitialized) return;
    if (loadRequest) return loadRequest;

    set(force
      ? { isRefreshing: true, error: null }
      : { isLoading: true, error: null });

    const requestGeneration = loadGeneration;
    const request = favoritesApi.listFavorites()
      .then((data) => {
        if (requestGeneration === loadGeneration) {
          set({ favorites: data.favorites, isInitialized: true, error: null });
        }
      })
      .catch((error: unknown) => {
        if (requestGeneration === loadGeneration) {
          set({
            error: getApiErrorMessage(error, 'Không thể tải danh sách yêu thích.'),
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

  refreshFavorites: () => get().loadFavorites(true),

  toggleFavorite: async (productId) => {
    if (get().updatingProductIds.has(productId)) {
      return get().favorites.some((item) => item.product.id === productId);
    }

    const currentlyFavorite = get().favorites.some((item) => item.product.id === productId);
    set((state) => ({
      error: null,
      updatingProductIds: new Set(state.updatingProductIds).add(productId),
    }));

    try {
      if (currentlyFavorite) {
        await favoritesApi.removeFavorite(productId);
        set((state) => ({
          favorites: state.favorites.filter((item) => item.product.id !== productId),
        }));
        return false;
      }

      const favorite = await favoritesApi.addFavorite(productId);
      set((state) => ({
        favorites: [favorite, ...state.favorites.filter(
          (item) => item.product.id !== productId,
        )],
      }));
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Không thể cập nhật sản phẩm yêu thích.') });
      throw error;
    } finally {
      set((state) => {
        const updatingProductIds = new Set(state.updatingProductIds);
        updatingProductIds.delete(productId);
        return { updatingProductIds };
      });
    }
  },

  resetFavorites: () => {
    loadGeneration += 1;
    loadRequest = null;
    set({
      favorites: [],
      error: null,
      isInitialized: false,
      isLoading: false,
      isRefreshing: false,
      updatingProductIds: new Set<number>(),
    });
  },
}));
