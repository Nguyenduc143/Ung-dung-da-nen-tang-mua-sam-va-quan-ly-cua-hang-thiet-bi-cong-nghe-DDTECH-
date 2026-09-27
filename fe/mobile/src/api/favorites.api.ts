import type { ApiResponse, FavoriteItem, FavoriteListData } from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

const normalizeFavorite = (favorite: FavoriteItem): FavoriteItem => ({
  ...favorite,
  product: {
    ...favorite.product,
    imageUrl: resolveMediaUrl(favorite.product.imageUrl),
  },
});

export const listFavorites = async (): Promise<FavoriteListData> => {
  const response = await apiClient.get<ApiResponse<FavoriteListData>>('/favorites');
  return {
    favorites: response.data.data.favorites.map(normalizeFavorite),
  };
};

export const addFavorite = async (productId: number): Promise<FavoriteItem> => {
  const response = await apiClient.post<ApiResponse<{ favorite: FavoriteItem }>>(
    `/favorites/${productId}`,
  );
  return normalizeFavorite(response.data.data.favorite);
};

export const removeFavorite = async (productId: number): Promise<void> => {
  await apiClient.delete(`/favorites/${productId}`);
};
