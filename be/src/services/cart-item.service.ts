import type { PoolConnection } from 'mysql2/promise';
import { withTransaction } from '../config/database';
import * as cartItemRepository from '../repositories/cart-item.repository';
import * as cartRepository from '../repositories/cart.repository';
import { AppError } from '../utils/app-error';
import type { AddCartItemInput,UpdateCartItemInput } from '../validators/cart.validator';
import { getCart } from './cart.service';

export const ensureProductCanBePurchased = (product: cartRepository.CartProductRecord | null): void => {
  if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
  if (product.status !== 'ACTIVE' || product.deletedAt !== null) {
    throw new AppError(409, 'Sản phẩm hiện không khả dụng');
  }
};

export const getAvailableStock = async (
  connection: PoolConnection,
  product: cartRepository.CartProductRecord,
  variantId: number | null,
): Promise<number> => {
  if (product.hasVariants === 1) {
    if (variantId === null) {
      throw new AppError(422, 'Sản phẩm này yêu cầu chọn phiên bản');
    }
    const variant = await cartRepository.findVariantForUpdate(connection, variantId);
    if (!variant || variant.productId !== product.id) {
      throw new AppError(422, 'Phiên bản không thuộc sản phẩm này');
    }
    if (variant.status !== 'ACTIVE') {
      throw new AppError(409, 'Phiên bản sản phẩm hiện không khả dụng');
    }
    return variant.stock;
  }

  if (variantId !== null) {
    throw new AppError(422, 'Sản phẩm này không sử dụng phiên bản');
  }
  return product.stock;
};

export const ensureEnoughStock = (quantity: number, stock: number): void => {
  if (quantity > stock) {
    throw new AppError(409, 'Số lượng sản phẩm trong giỏ vượt quá tồn kho hiện tại', {
      requestedQuantity: quantity,
      availableStock: stock,
    });
  }
};

export const addCartItem = async (userId: number, input: AddCartItemInput) => {
  await withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const product = await cartRepository.findProductForUpdate(connection, input.productId);
    ensureProductCanBePurchased(product);
    const variantId = input.variantId ?? null;
    const stock = await getAvailableStock(connection, product!, variantId);
    const existing = await cartItemRepository.findCartItemForUpdate(
      connection,
      cartId,
      input.productId,
      variantId,
    );
    const quantity = (existing?.quantity ?? 0) + input.quantity;
    ensureEnoughStock(quantity, stock);

    if (existing) {
      await cartItemRepository.updateCartItemQuantity(connection, cartId, existing.id, quantity);
    } else {
      await cartItemRepository.createCartItem(
        connection,
        cartId,
        input.productId,
        variantId,
        quantity,
      );
    }
    await cartRepository.touchCart(connection, cartId);
  });
  return getCart(userId);
};

export const updateCartItem = async (
  userId: number,
  itemId: number,
  input: UpdateCartItemInput,
) => {
  await withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const item = await cartItemRepository.findOwnedCartItemForUpdate(connection, cartId, itemId);
    if (!item) throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
    const product = await cartRepository.findProductForUpdate(connection, item.productId);
    ensureProductCanBePurchased(product);
    const stock = await getAvailableStock(connection, product!, item.variantId);
    ensureEnoughStock(input.quantity, stock);
    await cartItemRepository.updateCartItemQuantity(connection, cartId, itemId, input.quantity);
    await cartRepository.touchCart(connection, cartId);
  });
  return getCart(userId);
};

export const deleteCartItem = async (userId: number, itemId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const item = await cartItemRepository.findOwnedCartItemForUpdate(connection, cartId, itemId);
    if (!item || !(await cartItemRepository.deleteCartItem(connection, cartId, itemId))) {
      throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
    }
    await cartRepository.touchCart(connection, cartId);
  });
};
