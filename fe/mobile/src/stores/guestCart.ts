import AsyncStorage from '@react-native-async-storage/async-storage';

import * as cartApi from '@/api/cart.api';
import { getProduct } from '@/api/products.api';
import type { AddCartItemInput, CartData, CartItem } from '@/types';

const storageKey = 'ddtech.guest-cart.v1';
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation);
  queue = result.catch(() => undefined);
  return result;
}

function buildCart(items: CartItem[]): CartData {
  const now = new Date().toISOString();
  return {
    cart: { id: 0, userId: 0, createdAt: now, updatedAt: now },
    items,
    summary: {
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    },
  };
}

async function readItems(): Promise<CartItem[]> {
  const value = await AsyncStorage.getItem(storageKey);
  if (!value) return [];
  const items: unknown = JSON.parse(value);
  if (!Array.isArray(items) || items.some((item) => (
    !item || !Number.isInteger(item.id) || item.id >= 0
    || !Number.isInteger(item.product?.id)
    || !Number.isInteger(item.quantity) || item.quantity < 1
  ))) throw new Error('Dữ liệu giỏ khách không hợp lệ. Vui lòng xóa giỏ và thử lại.');
  return items as CartItem[];
}

async function saveItems(items: CartItem[]): Promise<CartData> {
  await AsyncStorage.setItem(storageKey, JSON.stringify(items));
  return buildCart(items);
}

export const loadGuestCart = () => serialize(async () => buildCart(await readItems()));

export const addGuestItem = (input: AddCartItemInput) => serialize(async () => {
  const items = await readItems();
  const detail = await getProduct(input.productId);
  const { product } = detail;
  const variant = input.variantId == null ? null : (
    detail.variants.find((item) => item.id === input.variantId) ?? null
  );
  if (product.hasVariants && !variant) throw new Error('Vui lòng chọn phiên bản sản phẩm.');
  if (input.variantId != null && !variant) throw new Error('Phiên bản sản phẩm không tồn tại.');
  const stock = variant?.stock ?? product.stock;
  const existing = items.find((item) => (
    item.product.id === product.id && (item.variant?.id ?? null) === (variant?.id ?? null)
  ));
  const quantity = (existing?.quantity ?? 0) + input.quantity;
  if (product.status !== 'ACTIVE' || (variant && variant.status !== 'ACTIVE')) {
    throw new Error('Sản phẩm hiện không còn bán.');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || quantity > stock) {
    throw new Error(`Sản phẩm hiện chỉ còn ${stock}. Vui lòng kiểm tra số lượng trong giỏ.`);
  }
  const price = variant?.price ?? product.price;
  const salePrice = variant ? variant.salePrice : product.salePrice;
  const currentPrice = salePrice !== null && salePrice < price ? salePrice : price;
  const now = new Date().toISOString();
  const item: CartItem = {
    id: existing?.id ?? Math.min(0, ...items.map((item) => item.id)) - 1,
    product,
    variant,
    imageUrl: variant?.imageUrl ?? product.primaryImageUrl ?? detail.images[0]?.imageUrl ?? null,
    quantity,
    currentPrice,
    lineTotal: currentPrice * quantity,
    availableStock: stock,
    isAvailable: stock > 0,
    hasSufficientStock: quantity <= stock,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  return saveItems([...items.filter((entry) => entry.id !== item.id), item]);
});

export const updateGuestItem = (itemId: number, quantity: number) => serialize(async () => {
  const items = await readItems();
  const item = items.find((entry) => entry.id === itemId);
  if (!item) throw new Error('Không tìm thấy sản phẩm trong giỏ.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.availableStock) {
    throw new Error(`Sản phẩm hiện chỉ còn ${item.availableStock}.`);
  }
  return saveItems(items.map((entry) => entry.id === itemId ? {
    ...entry, quantity, lineTotal: quantity * entry.currentPrice, updatedAt: new Date().toISOString(),
  } : entry));
});

export const removeGuestItem = (itemId: number) => serialize(async () => (
  saveItems((await readItems()).filter((item) => item.id !== itemId))
));
export const clearGuestCart = () => serialize(() => saveItems([]));

/** Remove only successfully transferred items; preserve the remainder if the API fails. */
export const mergeGuestCart = (canTransfer: () => boolean = () => true) => serialize(async () => {
  let items = await readItems();
  while (items.length > 0) {
    if (!canTransfer()) throw new Error('Phiên đăng nhập đã thay đổi.');
    const item = items[0];
    await cartApi.addCartItem({
      productId: item.product.id, variantId: item.variant?.id ?? null, quantity: item.quantity,
    });
    items = items.slice(1);
    await saveItems(items);
  }
});
