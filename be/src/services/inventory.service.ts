import { withTransaction } from '../config/database';
import * as inventoryRepository from '../repositories/inventory.repository';
import { emitToAll } from '../socket';
import { AppError } from '../utils/app-error';
import type {
  AdjustInventoryInput,
  ImportInventoryInput,
  InventoryQuery,
  InventoryTransactionQuery,
} from '../validators/inventory.validator';

const MAX_UNSIGNED_INT = 4294967295n;

const toVariantResponse = (variant: inventoryRepository.InventoryVariantRecord) => ({
  id: variant.id,
  productId: variant.productId,
  sku: variant.sku,
  variantName: variant.variantName,
  stock: variant.stock,
  soldCount: variant.soldCount,
  status: variant.status,
  updatedAt: variant.updatedAt,
});

const toProductResponse = (
  product: inventoryRepository.InventoryProductRecord,
  variants: inventoryRepository.InventoryVariantRecord[],
) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  stock: product.stock,
  soldCount: product.soldCount,
  hasVariants: product.hasVariants === 1,
  status: product.status,
  variants: variants.map(toVariantResponse),
  updatedAt: product.updatedAt,
});

const toTransactionResponse = (
  transaction: inventoryRepository.InventoryTransactionRecord,
) => ({
  id: transaction.id,
  product: {
    id: transaction.productId,
    name: transaction.productName,
    sku: transaction.productSku,
  },
  variant: transaction.variantId === null
    ? null
    : {
        id: transaction.variantId,
        name: transaction.variantName,
        sku: transaction.variantSku,
      },
  type: transaction.type,
  quantity: transaction.quantity,
  stockAfter: transaction.stockAfter,
  referenceType: transaction.referenceType,
  referenceId: transaction.referenceId,
  note: transaction.note,
  createdBy: transaction.createdBy === null
    ? null
    : { id: transaction.createdBy, fullName: transaction.createdByName },
  createdAt: transaction.createdAt,
});

const pagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export const listInventory = async (query: InventoryQuery) => {
  const result = await inventoryRepository.listInventory(query);
  const variantsByProduct = new Map<number, inventoryRepository.InventoryVariantRecord[]>();
  for (const variant of result.variants) {
    const variants = variantsByProduct.get(variant.productId) ?? [];
    variants.push(variant);
    variantsByProduct.set(variant.productId, variants);
  }
  return {
    products: result.products.map((product) => toProductResponse(
      product,
      variantsByProduct.get(product.id) ?? [],
    )),
    pagination: pagination(query.page, query.limit, result.total),
  };
};

export const listLowStock = async (threshold: number) => ({
  threshold,
  items: (await inventoryRepository.listLowStock(threshold)).map((item) => ({
    product: {
      id: item.productId,
      name: item.productName,
      sku: item.productSku,
    },
    variant: item.variantId === null
      ? null
      : { id: item.variantId, name: item.variantName, sku: item.variantSku },
    stock: item.stock,
  })),
});

export const listTransactions = async (query: InventoryTransactionQuery) => {
  const result = await inventoryRepository.listTransactions(query);
  return {
    transactions: result.transactions.map(toTransactionResponse),
    pagination: pagination(query.page, query.limit, result.total),
  };
};

const calculateNewStock = (currentStock: number, quantity: number): number => {
  const newStock = BigInt(currentStock) + BigInt(quantity);
  if (newStock < 0n) throw new AppError(409, 'Tồn kho không đủ để thực hiện điều chỉnh');
  if (newStock > MAX_UNSIGNED_INT) {
    throw new AppError(422, 'Tồn kho mới vượt quá giới hạn cho phép');
  }
  return Number(newStock);
};

const changeStock = async (
  adminId: number,
  input: AdjustInventoryInput | ImportInventoryInput,
  type: 'ADJUSTMENT' | 'IMPORT',
) => {
  const changed = await withTransaction(async (connection) => {
    const product = await inventoryRepository.findProductForUpdate(input.productId, connection);
    if (!product || product.deletedAt !== null) throw new AppError(404, 'Không tìm thấy sản phẩm');
    const variantId = input.variantId ?? null;

    let stockAfter: number;
    let variantStock: number | null = null;
    let productStock: number;
    if (product.hasVariants === 1) {
      if (variantId === null) {
        throw new AppError(422, 'Sản phẩm có phiên bản bắt buộc phải cung cấp variantId');
      }
      const variant = await inventoryRepository.findVariantForUpdate(variantId, connection);
      if (!variant || variant.productId !== product.id) {
        throw new AppError(422, 'Phiên bản không thuộc sản phẩm này');
      }
      stockAfter = calculateNewStock(variant.stock, input.quantity);
      await inventoryRepository.updateVariantStock(variant.id, stockAfter, connection);
      const totalVariantStock = BigInt(await inventoryRepository.sumVariantStock(
        product.id,
        connection,
      ));
      if (totalVariantStock > MAX_UNSIGNED_INT) {
        throw new AppError(422, 'Tổng tồn kho các phiên bản vượt quá giới hạn cho phép');
      }
      productStock = Number(totalVariantStock);
      variantStock = stockAfter;
      await inventoryRepository.updateProductStock(product.id, productStock, connection);
    } else {
      if (variantId !== null) {
        throw new AppError(422, 'Sản phẩm này không sử dụng phiên bản');
      }
      stockAfter = calculateNewStock(product.stock, input.quantity);
      productStock = stockAfter;
      await inventoryRepository.updateProductStock(product.id, stockAfter, connection);
    }

    const transactionId = await inventoryRepository.createTransaction({
      productId: product.id,
      variantId,
      type,
      quantity: input.quantity,
      stockAfter,
      note: input.note ?? null,
      createdBy: adminId,
    }, connection);
    return {
      transactionId,
      productId: product.id,
      variantId,
      productStock,
      variantStock,
    };
  });

  const transaction = await inventoryRepository.findTransaction(changed.transactionId);
  if (!transaction) throw new Error('Newly created inventory transaction could not be loaded');
  const event = {
    productId: changed.productId,
    variantId: changed.variantId,
    productStock: changed.productStock,
    variantStock: changed.variantStock,
    quantity: input.quantity,
    type,
  };
  emitToAll('product:stock_updated', event);
  emitToAll('product:updated', event);
  return {
    transaction: toTransactionResponse(transaction),
    stock: {
      productId: changed.productId,
      variantId: changed.variantId,
      productStock: changed.productStock,
      variantStock: changed.variantStock,
    },
  };
};

export const adjustInventory = async (adminId: number, input: AdjustInventoryInput) =>
  changeStock(adminId, input, 'ADJUSTMENT');

export const importInventory = async (adminId: number, input: ImportInventoryInput) =>
  changeStock(adminId, input, 'IMPORT');
