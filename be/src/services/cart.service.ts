import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import * as cartRepository from '../repositories/cart.repository';
import { AppError } from '../utils/app-error';
import type { AddCartItemInput, UpdateCartItemInput } from '../validators/cart.validator';

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const ensureProductCanBePurchased = (product: cartRepository.CartProductRecord | null): void => {
  if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
  if (product.status !== 'ACTIVE' || product.deletedAt !== null) {
    throw new AppError(409, 'Sản phẩm hiện không khả dụng');
  }
};

const getAvailableStock = async (
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

const ensureEnoughStock = (quantity: number, stock: number): void => {
  if (quantity > stock) {
    throw new AppError(409, 'Số lượng sản phẩm trong giỏ vượt quá tồn kho hiện tại', {
      requestedQuantity: quantity,
      availableStock: stock,
    });
  }
};

const toCartItemResponse = (item: cartRepository.CartItemDetailRecord) => {
  const currentPrice = Number(item.currentPrice);
  const productAvailable = item.productStatus === 'ACTIVE' && item.productDeletedAt === null;
  const selectionAvailable = item.hasVariants === 1
    ? item.variantId !== null && item.variantStatus === 'ACTIVE'
    : item.variantId === null;

  return {
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.productId,
      name: item.productName,
      slug: item.productSlug,
      sku: item.productSku,
      price: Number(item.productPrice),
      salePrice: item.productSalePrice === null ? null : Number(item.productSalePrice),
      stock: item.productStock,
      hasVariants: item.hasVariants === 1,
      ratingAvg: Number(item.ratingAvg),
      reviewCount: item.reviewCount,
      status: item.productStatus,
    },
    variant: item.variantId === null
      ? null
      : {
          id: item.variantId,
          variantName: item.variantName,
          sku: item.variantSku,
          attributes: parseJson(item.variantAttributes),
          price: item.variantPrice === null ? null : Number(item.variantPrice),
          salePrice: item.variantSalePrice === null ? null : Number(item.variantSalePrice),
          stock: item.variantStock,
          status: item.variantStatus,
        },
    imageUrl: item.imageUrl,
    currentPrice,
    lineTotal: currentPrice * item.quantity,
    availableStock: item.availableStock,
    isAvailable: productAvailable && selectionAvailable,
    hasSufficientStock: item.quantity <= item.availableStock,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const ensureCart = async (userId: number): Promise<number> =>
  withTransaction((connection) => cartRepository.getOrCreateCart(connection, userId));

export const getCart = async (userId: number) => {
  const cartId = await ensureCart(userId);
  const [cart, records] = await Promise.all([
    cartRepository.findCartByUser(userId),
    cartRepository.listCartItems(cartId),
  ]);
  if (!cart) throw new Error('User cart could not be loaded');

  const items = records.map(toCartItemResponse);
  return {
    cart: {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    },
    items,
    summary: {
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    },
  };
};

export const addCartItem = async (userId: number, input: AddCartItemInput) => {
  await withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const product = await cartRepository.findProductForUpdate(connection, input.productId);
    ensureProductCanBePurchased(product);
    const variantId = input.variantId ?? null;
    const stock = await getAvailableStock(connection, product!, variantId);
    const existing = await cartRepository.findCartItemForUpdate(
      connection,
      cartId,
      input.productId,
      variantId,
    );
    const quantity = (existing?.quantity ?? 0) + input.quantity;
    ensureEnoughStock(quantity, stock);

    if (existing) {
      await cartRepository.updateCartItemQuantity(connection, cartId, existing.id, quantity);
    } else {
      await cartRepository.createCartItem(
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
    const item = await cartRepository.findOwnedCartItemForUpdate(connection, cartId, itemId);
    if (!item) throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
    const product = await cartRepository.findProductForUpdate(connection, item.productId);
    ensureProductCanBePurchased(product);
    const stock = await getAvailableStock(connection, product!, item.variantId);
    ensureEnoughStock(input.quantity, stock);
    await cartRepository.updateCartItemQuantity(connection, cartId, itemId, input.quantity);
    await cartRepository.touchCart(connection, cartId);
  });
  return getCart(userId);
};

export const deleteCartItem = async (userId: number, itemId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const item = await cartRepository.findOwnedCartItemForUpdate(connection, cartId, itemId);
    if (!item || !(await cartRepository.deleteCartItem(connection, cartId, itemId))) {
      throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
    }
    await cartRepository.touchCart(connection, cartId);
  });
};

export const clearCart = async (userId: number): Promise<number> =>
  withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const removedCount = await cartRepository.clearCart(connection, cartId);
    await cartRepository.touchCart(connection, cartId);
    return removedCount;
  });
