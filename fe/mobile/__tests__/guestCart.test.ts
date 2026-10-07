import AsyncStorage from '@react-native-async-storage/async-storage';

import * as cartApi from '@/api/cart.api';
import { getProduct } from '@/api/products.api';
import { setAuthenticatedUserId } from '@/stores/authIdentity';
import { useCartStore } from '@/stores/cartStore';
import {
  addGuestItem, clearGuestCart, loadGuestCart, mergeGuestCart, removeGuestItem, updateGuestItem,
} from '@/stores/guestCart';
import type { CartData, ProductDetailData } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () => (
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
));
jest.mock('@/api/cart.api', () => ({
  getCart: jest.fn(), addCartItem: jest.fn(), updateCartItem: jest.fn(),
  removeCartItem: jest.fn(), clearCart: jest.fn(),
}));
jest.mock('@/api/products.api', () => ({ getProduct: jest.fn() }));
jest.mock('@/stores/badgeStore', () => ({
  useBadgeStore: { getState: () => ({ setCartItemCount: jest.fn() }) },
}));

const fixture = {
  product: {
    id: 1, name: 'Phone', slug: 'phone', sku: 'PHONE', price: 100, salePrice: 80,
    stock: 10, hasVariants: false, status: 'ACTIVE', primaryImageUrl: null,
  },
  variants: [], images: [],
} as unknown as ProductDetailData;

beforeEach(async () => {
  jest.clearAllMocks();
  setAuthenticatedUserId(0);
  await AsyncStorage.clear();
  useCartStore.getState().resetCart();
  (getProduct as jest.Mock).mockResolvedValue(fixture);
  (cartApi.addCartItem as jest.Mock).mockResolvedValue({});
});

test('guest can add, update and remove without calling private cart APIs', async () => {
  let cart = await useCartStore.getState().addItem({ productId: 1, quantity: 2 });
  const itemId = cart.items[0].id;
  expect(itemId).toBeLessThan(0);
  expect(cart.summary).toEqual({ totalItems: 2, subtotal: 160 });
  cart = await useCartStore.getState().updateItemQuantity(itemId, 3);
  expect(cart.summary.subtotal).toBe(240);
  cart = await useCartStore.getState().removeItem(itemId);
  expect(cart.items).toEqual([]);
  expect(cartApi.addCartItem).not.toHaveBeenCalled();
  expect(cartApi.updateCartItem).not.toHaveBeenCalled();
  expect(cartApi.removeCartItem).not.toHaveBeenCalled();
});

test('guest cart survives resetting the in-memory store', async () => {
  await useCartStore.getState().addItem({ productId: 1, quantity: 2 });
  useCartStore.getState().resetCart();
  const cart = await useCartStore.getState().loadCart(true);
  expect(cart.items[0].quantity).toBe(2);
  expect(cartApi.getCart).not.toHaveBeenCalled();
});

test('same product merges quantities and rejects exceeding stock without changing storage', async () => {
  await addGuestItem({ productId: 1, quantity: 2 });
  const cart = await addGuestItem({ productId: 1, quantity: 3 });
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].quantity).toBe(5);
  await expect(addGuestItem({ productId: 1, quantity: 6 })).rejects.toThrow('chỉ còn 10');
  await expect(updateGuestItem(cart.items[0].id, 0)).rejects.toThrow();
  expect((await loadGuestCart()).items[0].quantity).toBe(5);
});

test('different variants remain separate; clearing persists an empty cart', async () => {
  (getProduct as jest.Mock).mockResolvedValue({
    ...fixture,
    product: { ...fixture.product, hasVariants: true },
    variants: [11, 12].map((id) => ({
      id, productId: 1, stock: 10, status: 'ACTIVE', price: 120, salePrice: null,
    })),
  });
  await addGuestItem({ productId: 1, variantId: 11, quantity: 1 });
  await addGuestItem({ productId: 1, variantId: 12, quantity: 1 });
  expect((await loadGuestCart()).items).toHaveLength(2);
  await clearGuestCart();
  expect((await loadGuestCart()).items).toEqual([]);
});

test('partial transfer preserves unsuccessful items and never repeats successful ones', async () => {
  await addGuestItem({ productId: 1, quantity: 1 });
  (getProduct as jest.Mock).mockResolvedValue({
    ...fixture, product: { ...fixture.product, id: 2 },
  });
  await addGuestItem({ productId: 2, quantity: 2 });
  (cartApi.addCartItem as jest.Mock)
    .mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Out of stock'));
  await expect(mergeGuestCart()).rejects.toThrow('Out of stock');
  expect((await loadGuestCart()).items.map((item) => item.product.id)).toEqual([2]);
  await mergeGuestCart();
  expect(cartApi.addCartItem).toHaveBeenCalledTimes(3);
  expect((await loadGuestCart()).items).toEqual([]);
});

test('login replaces cached guest cart with server IDs and serializes duplicate loads', async () => {
  await useCartStore.getState().addItem({ productId: 1, quantity: 2 });
  setAuthenticatedUserId(7);
  const serverCart = {
    cart: { id: 8, userId: 7 }, items: [{ id: 101, quantity: 2 }],
    summary: { totalItems: 2, subtotal: 160 },
  } as CartData;
  (cartApi.getCart as jest.Mock).mockResolvedValue(serverCart);
  await Promise.all([
    useCartStore.getState().loadCart(), useCartStore.getState().loadCart(true),
  ]);
  expect(cartApi.addCartItem).toHaveBeenCalledTimes(1);
  expect(cartApi.addCartItem).toHaveBeenCalledWith({ productId: 1, variantId: null, quantity: 2 });
  expect(useCartStore.getState().cart?.items[0].id).toBe(101);
  expect((await loadGuestCart()).items).toEqual([]);
});

test('transfer stops when the account changes', async () => {
  await addGuestItem({ productId: 1, quantity: 1 });
  await expect(mergeGuestCart(() => false)).rejects.toThrow('đã thay đổi');
  expect(cartApi.addCartItem).not.toHaveBeenCalled();
  expect((await loadGuestCart()).items).toHaveLength(1);
  await removeGuestItem((await loadGuestCart()).items[0].id);
});
