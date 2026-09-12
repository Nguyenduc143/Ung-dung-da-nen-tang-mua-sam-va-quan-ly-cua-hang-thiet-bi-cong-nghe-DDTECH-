import { withTransaction } from '../config/database';
import * as cartRepository from '../repositories/cart.repository';
import * as productRepository from '../repositories/product.repository';
import { AppError } from '../utils/app-error';
import type { AddCartItemInput, UpdateCartItemInput } from '../validators/cart.validator';

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const priceOf = (item: cartRepository.CartItemRecord): number => {
  const price = item.variant_id === null ? item.product_price : item.variant_price;
  const salePrice = item.variant_id === null ? item.product_sale_price : item.variant_sale_price;
  return Number(salePrice ?? price ?? 0);
};

const stockOf = (item: cartRepository.CartItemRecord): number =>
  item.variant_id === null ? item.product_stock : Number(item.variant_stock ?? 0);

const toItemResponse = (item: cartRepository.CartItemRecord) => {
  const unitPrice = priceOf(item);
  return {
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    productName: item.product_name,
    productSlug: item.product_slug,
    productSku: item.product_sku,
    productImage: item.product_image,
    variantName: item.variant_name,
    variantSku: item.variant_sku,
    unitPrice,
    quantity: item.quantity,
    subtotal: unitPrice * item.quantity,
    stock: stockOf(item),
  };
};

const ensureActiveItem = (item: cartRepository.CartItemRecord) => {
  if (item.product_status !== 'ACTIVE' || item.product_deleted_at !== null) {
    throw new AppError(409, 'Sản phẩm trong giỏ không còn hoạt động');
  }
  if (item.variant_id !== null && item.variant_status !== 'ACTIVE') {
    throw new AppError(409, 'Variant trong giỏ không còn hoạt động');
  }
};

const ensureQuantityInStock = (item: cartRepository.CartItemRecord, quantity: number) => {
  if (quantity > stockOf(item)) {
    throw new AppError(409, 'Số lượng sản phẩm vượt quá tồn kho');
  }
};

export const getCart = async (userId: number) => {
  const items = await cartRepository.listItems(userId);
  items.forEach(ensureActiveItem);
  const mappedItems = items.map(toItemResponse);
  return {
    items: mappedItems,
    totalItems: mappedItems.reduce((total, item) => total + item.quantity, 0),
    subtotal: mappedItems.reduce((total, item) => total + item.subtotal, 0),
  };
};

export const addItem = async (userId: number, input: AddCartItemInput) => {
  try {
    const itemId = await withTransaction(async (connection) => {
      const product = await productRepository.findById(input.productId);
      if (!product || product.status !== 'ACTIVE' || product.deleted_at !== null) {
        throw new AppError(404, 'Không tìm thấy sản phẩm hoạt động');
      }

      if (input.variantId !== null && input.variantId !== undefined) {
        const variant = await productRepository.findVariantById(input.variantId);
        if (!variant || variant.product_id !== input.productId) {
          throw new AppError(400, 'Variant không thuộc sản phẩm');
        }
        if (variant.status !== 'ACTIVE') throw new AppError(409, 'Variant không còn hoạt động');
        if (input.quantity > variant.stock) throw new AppError(409, 'Số lượng vượt quá tồn kho variant');
      } else if (input.quantity > product.stock) {
        throw new AppError(409, 'Số lượng vượt quá tồn kho sản phẩm');
      }

      const cart = await cartRepository.getOrCreateCart(connection, userId);
      const existing = await cartRepository.findItemForUpdate(
        connection,
        cart.id,
        input.productId,
        input.variantId ?? null,
      );
      if (!existing) {
        await cartRepository.addItem(connection, cart.id, input);
        const inserted = await cartRepository.findItemForUpdate(
          connection,
          cart.id,
          input.productId,
          input.variantId ?? null,
        );
        if (!inserted) throw new Error('Newly added cart item could not be loaded');
        return inserted.id;
      }

      ensureActiveItem(existing);
      const newQuantity = existing.quantity + input.quantity;
      ensureQuantityInStock(existing, newQuantity);
      await cartRepository.updateItemQuantity(connection, existing.id, newQuantity);
      return existing.id;
    });

    const item = await cartRepository.findItemByIdForUser(userId, itemId);
    if (!item) throw new Error('Cart item could not be loaded');
    return toItemResponse(item);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Sản phẩm đã tồn tại trong giỏ hàng');
    throw error;
  }
};

export const updateItem = async (
  userId: number,
  itemId: number,
  input: UpdateCartItemInput,
) => {
  const current = await cartRepository.findItemByIdForUser(userId, itemId);
  if (!current) throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
  ensureActiveItem(current);
  ensureQuantityInStock(current, input.quantity);

  await withTransaction(async (connection) => {
    await cartRepository.updateItemQuantity(connection, itemId, input.quantity);
  });
  const updated = await cartRepository.findItemByIdForUser(userId, itemId);
  if (!updated) throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
  return toItemResponse(updated);
};

export const removeItem = async (userId: number, itemId: number): Promise<void> => {
  if (!(await cartRepository.deleteItem(userId, itemId))) {
    throw new AppError(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
  }
};

export const clear = async (userId: number): Promise<void> => {
  await cartRepository.clearCart(userId);
};