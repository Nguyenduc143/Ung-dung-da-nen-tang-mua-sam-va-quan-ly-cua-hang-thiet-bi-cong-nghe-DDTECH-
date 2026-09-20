import { withTransaction } from '../config/database';
import * as cartItemRepository from '../repositories/cart-item.repository';
import * as cartRepository from '../repositories/cart.repository';

export const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export const toCartItemResponse = (item: cartItemRepository.CartItemDetailRecord) => {
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

export const ensureCart = async (userId: number): Promise<number> =>
  withTransaction((connection) => cartRepository.getOrCreateCart(connection, userId));

export const getCart = async (userId: number) => {
  const cartId = await ensureCart(userId);
  const [cart, records] = await Promise.all([
    cartRepository.findCartByUser(userId),
    cartItemRepository.listCartItems(cartId),
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

export const clearCart = async (userId: number): Promise<number> =>
  withTransaction(async (connection) => {
    const cartId = await cartRepository.getOrCreateCart(connection, userId);
    const removedCount = await cartRepository.clearCart(connection, cartId);
    await cartRepository.touchCart(connection, cartId);
    return removedCount;
  });
