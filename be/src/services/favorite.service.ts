import { withTransaction } from '../config/database';
import * as favoriteRepository from '../repositories/favorite.repository';
import { AppError } from '../utils/app-error';

const toFavoriteResponse = (favorite: favoriteRepository.FavoriteProductRecord) => ({
  id: favorite.id,
  createdAt: favorite.createdAt,
  product: {
    id: favorite.productId,
    name: favorite.name,
    slug: favorite.slug,
    sku: favorite.sku,
    shortDescription: favorite.shortDescription,
    price: Number(favorite.price),
    salePrice: favorite.salePrice === null ? null : Number(favorite.salePrice),
    stock: favorite.stock,
    hasVariants: favorite.hasVariants === 1,
    ratingAvg: Number(favorite.ratingAvg),
    reviewCount: favorite.reviewCount,
    imageUrl: favorite.imageUrl,
    category: {
      id: favorite.categoryId,
      name: favorite.categoryName,
      slug: favorite.categorySlug,
    },
    brand: favorite.brandId === null
      ? null
      : { id: favorite.brandId, name: favorite.brandName, slug: favorite.brandSlug },
  },
});

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

export const listFavorites = async (userId: number) => ({
  favorites: (await favoriteRepository.listByUser(userId)).map(toFavoriteResponse),
});

export const addFavorite = async (userId: number, productId: number) => {
  try {
    await withTransaction(async (connection) => {
      const product = await favoriteRepository.findProductForUpdate(connection, productId);
      if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
      if (product.status !== 'ACTIVE' || product.deletedAt !== null) {
        throw new AppError(409, 'Sản phẩm hiện không khả dụng');
      }
      if (await favoriteRepository.findFavorite(connection, userId, productId)) {
        throw new AppError(409, 'Sản phẩm đã có trong danh sách yêu thích');
      }
      await favoriteRepository.createFavorite(connection, userId, productId);
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AppError(409, 'Sản phẩm đã có trong danh sách yêu thích');
    }
    throw error;
  }

  const favorite = (await favoriteRepository.listByUser(userId))
    .find((item) => item.productId === productId);
  if (!favorite) throw new Error('Newly created favorite could not be loaded');
  return toFavoriteResponse(favorite);
};

export const removeFavorite = async (userId: number, productId: number): Promise<void> => {
  if (!(await favoriteRepository.deleteFavorite(userId, productId))) {
    throw new AppError(404, 'Sản phẩm không có trong danh sách yêu thích');
  }
};
