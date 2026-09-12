import * as cartRepository from '../repositories/cart.repository';
import * as productRepository from '../repositories/product.repository';
import { AppError } from '../utils/app-error';

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const toFavoriteResponse = (favorite: cartRepository.FavoriteRecord) => ({
  id: favorite.id,
  productId: favorite.product_id,
  productName: favorite.product_name,
  productSlug: favorite.product_slug,
  productSku: favorite.product_sku,
  productImage: favorite.product_image,
  price: Number(favorite.price),
  salePrice: favorite.sale_price === null ? null : Number(favorite.sale_price),
  stock: favorite.stock,
  ratingAvg: Number(favorite.rating_avg),
  reviewCount: favorite.review_count,
  createdAt: favorite.created_at,
});

export const list = async (userId: number) =>
  (await cartRepository.listFavorites(userId)).map(toFavoriteResponse);

export const add = async (userId: number, productId: number) => {
  const product = await productRepository.findById(productId);
  if (!product || product.status !== 'ACTIVE' || product.deleted_at !== null) {
    throw new AppError(404, 'Không tìm thấy sản phẩm hoạt động');
  }

  try {
    await cartRepository.addFavorite(userId, productId);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Sản phẩm đã có trong danh sách yêu thích');
    throw error;
  }
};

export const remove = async (userId: number, productId: number): Promise<void> => {
  if (!(await cartRepository.removeFavorite(userId, productId))) {
    throw new AppError(404, 'Sản phẩm không có trong danh sách yêu thích');
  }
};