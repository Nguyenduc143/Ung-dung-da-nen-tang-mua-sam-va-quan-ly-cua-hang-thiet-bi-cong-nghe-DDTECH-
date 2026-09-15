import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';
import type {
  AdminOrderQuery,
  CustomerOrderQuery,
  OrderStatus,
} from '../validators/order.validator';

export interface CheckoutCartItemRecord extends RowDataPacket {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
}

export interface CheckoutProductRecord extends RowDataPacket {
  id: number;
  name: string;
  sku: string;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  soldCount: number;
  hasVariants: number;
  status: 'ACTIVE' | 'INACTIVE';
  deletedAt: Date | null;
}

export interface CheckoutVariantRecord extends RowDataPacket {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  soldCount: number;
  imageUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CheckoutAddressRecord extends RowDataPacket {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string | null;
  addressLine: string;
}

export interface ShippingMethodRecord extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  baseFee: string | number;
  freeThreshold: string | number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface OrderRecord extends RowDataPacket {
  id: number;
  orderCode: string;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMethodId: number | null;
  shippingMethodCode: string | null;
  shippingMethodName: string | null;
  promotionId: number | null;
  promotionCode: string | null;
  subtotal: string | number;
  shippingFee: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: OrderStatus;
  note: string | null;
  cancelReason: string | null;
  confirmedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemRecord extends RowDataPacket {
  id: number;
  orderId: number;
  productId: number | null;
  variantId: number | null;
  productName: string;
  productSku: string;
  productImage: string | null;
  variantName: string | null;
  originalPrice: string | number;
  price: string | number;
  quantity: number;
  subtotal: string | number;
  createdAt: Date;
}

export interface OrderStatusHistoryRecord extends RowDataPacket {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: number | null;
  changedByName: string | null;
  note: string | null;
  createdAt: Date;
}

interface CartRecord extends RowDataPacket {
  id: number;
}

interface CountRecord extends RowDataPacket {
  total: number;
}

const ORDER_COLUMNS = `o.id, o.order_code AS orderCode, o.user_id AS userId,
  o.receiver_name AS receiverName, o.receiver_phone AS receiverPhone,
  o.shipping_address AS shippingAddress, o.shipping_method_id AS shippingMethodId,
  sm.code AS shippingMethodCode, sm.name AS shippingMethodName,
  o.promotion_id AS promotionId, o.promotion_code AS promotionCode,
  o.subtotal, o.shipping_fee AS shippingFee, o.discount_amount AS discountAmount,
  o.total_amount AS totalAmount, o.payment_method AS paymentMethod,
  o.payment_status AS paymentStatus, o.status, o.note,
  o.cancel_reason AS cancelReason, o.confirmed_at AS confirmedAt,
  o.delivered_at AS deliveredAt, o.cancelled_at AS cancelledAt,
  o.created_at AS createdAt, o.updated_at AS updatedAt`;

export const findCartForUpdate = async (
  connection: PoolConnection,
  userId: number,
): Promise<number | null> => {
  const [rows] = await connection.execute<CartRecord[]>(
    'SELECT id FROM carts WHERE user_id = ? LIMIT 1 FOR UPDATE',
    [userId],
  );
  return rows[0]?.id ?? null;
};

export const listCartItemsForUpdate = async (
  connection: PoolConnection,
  cartId: number,
): Promise<CheckoutCartItemRecord[]> => {
  const [rows] = await connection.execute<CheckoutCartItemRecord[]>(
    `SELECT id, product_id AS productId, variant_id AS variantId, quantity
     FROM cart_items WHERE cart_id = ?
     ORDER BY product_id, variant_key FOR UPDATE`,
    [cartId],
  );
  return rows;
};

export const findProductForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<CheckoutProductRecord | null> => {
  const [rows] = await connection.execute<CheckoutProductRecord[]>(
    `SELECT id, name, sku, price, sale_price AS salePrice, stock,
            sold_count AS soldCount, has_variants AS hasVariants,
            status, deleted_at AS deletedAt
     FROM products WHERE id = ? LIMIT 1 FOR UPDATE`,
    [productId],
  );
  return rows[0] ?? null;
};

export const findVariantForUpdate = async (
  connection: PoolConnection,
  variantId: number,
): Promise<CheckoutVariantRecord | null> => {
  const [rows] = await connection.execute<CheckoutVariantRecord[]>(
    `SELECT id, product_id AS productId, sku, variant_name AS variantName,
            price, sale_price AS salePrice, stock, sold_count AS soldCount,
            image_url AS imageUrl, status
     FROM product_variants WHERE id = ? LIMIT 1 FOR UPDATE`,
    [variantId],
  );
  return rows[0] ?? null;
};

export const findProductImage = async (
  connection: PoolConnection,
  productId: number,
  variantId: number | null,
): Promise<string | null> => {
  const [rows] = await connection.execute<Array<RowDataPacket & { imageUrl: string }>>(
    `SELECT image_url AS imageUrl FROM product_images
     WHERE product_id = ?
     ORDER BY (variant_id = ?) DESC, is_primary DESC, sort_order, id
     LIMIT 1`,
    [productId, variantId],
  );
  return rows[0]?.imageUrl ?? null;
};

export const findOwnedAddress = async (
  connection: PoolConnection,
  userId: number,
  addressId: number,
): Promise<CheckoutAddressRecord | null> => {
  const [rows] = await connection.execute<CheckoutAddressRecord[]>(
    `SELECT receiver_name AS receiverName, receiver_phone AS receiverPhone,
            province, district, ward, address_line AS addressLine
     FROM addresses WHERE id = ? AND user_id = ? LIMIT 1`,
    [addressId, userId],
  );
  return rows[0] ?? null;
};

export const findShippingMethodForUpdate = async (
  connection: PoolConnection,
  shippingMethodId: number,
): Promise<ShippingMethodRecord | null> => {
  const [rows] = await connection.execute<ShippingMethodRecord[]>(
    `SELECT id, code, name, base_fee AS baseFee, free_threshold AS freeThreshold,
            estimated_days_min AS estimatedDaysMin,
            estimated_days_max AS estimatedDaysMax
     FROM shipping_methods
     WHERE id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE`,
    [shippingMethodId],
  );
  return rows[0] ?? null;
};

export const lockPromotion = async (
  connection: PoolConnection,
  promotionId: number,
): Promise<void> => {
  await connection.execute('SELECT id FROM promotions WHERE id = ? FOR UPDATE', [promotionId]);
};

export const createOrder = async (
  connection: PoolConnection,
  data: {
    orderCode: string;
    userId: number;
    receiverName: string;
    receiverPhone: string;
    shippingAddress: string;
    shippingMethodId: number;
    promotionId: number | null;
    promotionCode: string | null;
    subtotal: string;
    shippingFee: string;
    discountAmount: string;
    totalAmount: string;
    paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
    note: string | null;
  },
): Promise<number> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO orders
       (order_code, user_id, receiver_name, receiver_phone, shipping_address,
        shipping_method_id, promotion_id, promotion_code, subtotal, shipping_fee,
        discount_amount, total_amount, payment_method, payment_status, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', 'PENDING', ?)`,
    [
      data.orderCode,
      data.userId,
      data.receiverName,
      data.receiverPhone,
      data.shippingAddress,
      data.shippingMethodId,
      data.promotionId,
      data.promotionCode,
      data.subtotal,
      data.shippingFee,
      data.discountAmount,
      data.totalAmount,
      data.paymentMethod,
      data.note,
    ],
  );
  return result.insertId;
};

export const createOrderItem = async (
  connection: PoolConnection,
  data: {
    orderId: number;
    productId: number;
    variantId: number | null;
    productName: string;
    productSku: string;
    productImage: string | null;
    variantName: string | null;
    originalPrice: string;
    price: string;
    quantity: number;
  },
): Promise<void> => {
  await connection.execute(
    `INSERT INTO order_items
       (order_id, product_id, variant_id, product_name, product_sku, product_image,
        variant_name, original_price, price, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.orderId,
      data.productId,
      data.variantId,
      data.productName,
      data.productSku,
      data.productImage,
      data.variantName,
      data.originalPrice,
      data.price,
      data.quantity,
    ],
  );
};

export const decreaseProductInventory = async (
  connection: PoolConnection,
  productId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `UPDATE products
     SET stock = stock - ?, sold_count = sold_count + ?
     WHERE id = ? AND stock >= ?`,
    [quantity, quantity, productId, quantity],
  );
  return result.affectedRows > 0;
};

export const decreaseVariantInventory = async (
  connection: PoolConnection,
  variantId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `UPDATE product_variants
     SET stock = stock - ?, sold_count = sold_count + ?
     WHERE id = ? AND stock >= ?`,
    [quantity, quantity, variantId, quantity],
  );
  return result.affectedRows > 0;
};

export const restoreProductInventory = async (
  connection: PoolConnection,
  productId: number,
  quantity: number,
): Promise<void> => {
  await connection.execute(
    `UPDATE products
     SET stock = stock + ?, sold_count = GREATEST(sold_count - ?, 0)
     WHERE id = ?`,
    [quantity, quantity, productId],
  );
};

export const restoreVariantInventory = async (
  connection: PoolConnection,
  variantId: number,
  quantity: number,
): Promise<void> => {
  await connection.execute(
    `UPDATE product_variants
     SET stock = stock + ?, sold_count = GREATEST(sold_count - ?, 0)
     WHERE id = ?`,
    [quantity, quantity, variantId],
  );
};

export const createInventoryTransaction = async (
  connection: PoolConnection,
  data: {
    productId: number;
    variantId: number | null;
    type: 'SALE' | 'CANCEL_ORDER';
    quantity: number;
    stockAfter: number;
    orderId: number;
    note: string;
    createdBy: number | null;
  },
): Promise<void> => {
  await connection.execute(
    `INSERT INTO inventory_transactions
       (product_id, variant_id, type, quantity, stock_after, reference_type,
        reference_id, note, created_by)
     VALUES (?, ?, ?, ?, ?, 'order', ?, ?, ?)`,
    [
      data.productId,
      data.variantId,
      data.type,
      data.quantity,
      data.stockAfter,
      data.orderId,
      data.note,
      data.createdBy,
    ],
  );
};

export const createPromotionUsage = async (
  connection: PoolConnection,
  promotionId: number,
  userId: number,
  orderId: number,
  discountAmount: string,
): Promise<void> => {
  await connection.execute(
    `INSERT INTO promotion_usages
       (promotion_id, user_id, order_id, discount_amount)
     VALUES (?, ?, ?, ?)`,
    [promotionId, userId, orderId, discountAmount],
  );
  await connection.execute(
    'UPDATE promotions SET used_count = used_count + 1 WHERE id = ?',
    [promotionId],
  );
};

export const releasePromotionUsage = async (
  connection: PoolConnection,
  promotionId: number,
  orderId: number,
): Promise<void> => {
  const [result] = await connection.execute<ResultSetHeader>(
    'DELETE FROM promotion_usages WHERE promotion_id = ? AND order_id = ?',
    [promotionId, orderId],
  );
  if (result.affectedRows > 0) {
    await connection.execute(
      'UPDATE promotions SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?',
      [promotionId],
    );
  }
};

export const createStatusHistory = async (
  connection: PoolConnection,
  data: {
    orderId: number;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    changedBy: number | null;
    note: string | null;
  },
): Promise<void> => {
  await connection.execute(
    `INSERT INTO order_status_history
       (order_id, from_status, to_status, changed_by, note)
     VALUES (?, ?, ?, ?, ?)`,
    [data.orderId, data.fromStatus, data.toStatus, data.changedBy, data.note],
  );
};

export const clearCartItems = async (
  connection: PoolConnection,
  cartId: number,
): Promise<void> => {
  await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  await connection.execute('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cartId]);
};

export const createNotification = async (
  connection: PoolConnection,
  data: {
    userId: number;
    title: string;
    message: string;
    orderId: number;
  },
): Promise<void> => {
  await connection.execute(
    `INSERT INTO notifications
       (user_id, title, message, type, reference_type, reference_id)
     VALUES (?, ?, ?, 'ORDER', 'order', ?)`,
    [data.userId, data.title, data.message, data.orderId],
  );
};

export const createAdminNotifications = async (
  connection: PoolConnection,
  data: { title: string; message: string; orderId: number },
): Promise<void> => {
  await connection.execute(
    `INSERT INTO notifications
       (user_id, title, message, type, reference_type, reference_id)
     SELECT id, ?, ?, 'ORDER', 'order', ?
     FROM users
     WHERE role = 'ADMIN' AND status = 'ACTIVE' AND deleted_at IS NULL`,
    [data.title, data.message, data.orderId],
  );
};

const buildOrderFilters = (query: AdminOrderQuery | CustomerOrderQuery, userId?: number) => {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (userId !== undefined) {
    conditions.push('o.user_id = ?');
    values.push(userId);
  }
  if (query.status) {
    conditions.push('o.status = ?');
    values.push(query.status);
  }
  if ('search' in query && query.search) {
    conditions.push('(o.order_code LIKE ? OR o.receiver_name LIKE ? OR o.receiver_phone LIKE ?)');
    const search = `%${query.search}%`;
    values.push(search, search, search);
  }
  if ('paymentStatus' in query && query.paymentStatus) {
    conditions.push('o.payment_status = ?');
    values.push(query.paymentStatus);
  }
  if ('paymentMethod' in query && query.paymentMethod) {
    conditions.push('o.payment_method = ?');
    values.push(query.paymentMethod);
  }
  if ('userId' in query && query.userId) {
    conditions.push('o.user_id = ?');
    values.push(query.userId);
  }
  return { where: conditions.length > 0 ? conditions.join(' AND ') : '1 = 1', values };
};

export const listOrders = async (
  query: AdminOrderQuery | CustomerOrderQuery,
  userId?: number,
) => {
  const { where, values } = buildOrderFilters(query, userId);
  const offset = (query.page - 1) * query.limit;
  const [orders] = await pool.execute<OrderRecord[]>(
    `SELECT ${ORDER_COLUMNS}
     FROM orders o
     LEFT JOIN shipping_methods sm ON sm.id = o.shipping_method_id
     WHERE ${where}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ? OFFSET ?`,
    [...values, query.limit, offset],
  );
  const [countRows] = await pool.execute<CountRecord[]>(
    `SELECT COUNT(*) AS total FROM orders o WHERE ${where}`,
    values,
  );
  return { orders, total: countRows[0]?.total ?? 0 };
};

export const findOrder = async (
  orderId: number,
  userId?: number,
): Promise<OrderRecord | null> => {
  const owner = userId === undefined ? '' : ' AND o.user_id = ?';
  const values = userId === undefined ? [orderId] : [orderId, userId];
  const [rows] = await pool.execute<OrderRecord[]>(
    `SELECT ${ORDER_COLUMNS}
     FROM orders o
     LEFT JOIN shipping_methods sm ON sm.id = o.shipping_method_id
     WHERE o.id = ?${owner} LIMIT 1`,
    values,
  );
  return rows[0] ?? null;
};

export const findOrderForUpdate = async (
  connection: PoolConnection,
  orderId: number,
  userId?: number,
): Promise<OrderRecord | null> => {
  const owner = userId === undefined ? '' : ' AND o.user_id = ?';
  const values = userId === undefined ? [orderId] : [orderId, userId];
  const [rows] = await connection.execute<OrderRecord[]>(
    `SELECT ${ORDER_COLUMNS}
     FROM orders o
     LEFT JOIN shipping_methods sm ON sm.id = o.shipping_method_id
     WHERE o.id = ?${owner} LIMIT 1 FOR UPDATE`,
    values,
  );
  return rows[0] ?? null;
};

export const listOrderItems = async (
  orderId: number,
  connection?: PoolConnection,
): Promise<OrderItemRecord[]> => {
  const executor = connection ?? pool;
  const [rows] = await executor.execute<OrderItemRecord[]>(
    `SELECT id, order_id AS orderId, product_id AS productId,
            variant_id AS variantId, product_name AS productName,
            product_sku AS productSku, product_image AS productImage,
            variant_name AS variantName, original_price AS originalPrice,
            price, quantity, subtotal, created_at AS createdAt
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId],
  );
  return rows;
};

export const listStatusHistory = async (
  orderId: number,
): Promise<OrderStatusHistoryRecord[]> => {
  const [rows] = await pool.execute<OrderStatusHistoryRecord[]>(
    `SELECT osh.id, osh.from_status AS fromStatus, osh.to_status AS toStatus,
            osh.changed_by AS changedBy, u.full_name AS changedByName,
            osh.note, osh.created_at AS createdAt
     FROM order_status_history osh
     LEFT JOIN users u ON u.id = osh.changed_by
     WHERE osh.order_id = ? ORDER BY osh.created_at, osh.id`,
    [orderId],
  );
  return rows;
};

export const updateOrderStatus = async (
  connection: PoolConnection,
  orderId: number,
  status: OrderStatus,
): Promise<void> => {
  const timestampColumn: Partial<Record<OrderStatus, string>> = {
    CONFIRMED: 'confirmed_at = CURRENT_TIMESTAMP,',
    DELIVERED: 'delivered_at = CURRENT_TIMESTAMP,',
  };
  await connection.execute(
    `UPDATE orders SET ${timestampColumn[status] ?? ''} status = ? WHERE id = ?`,
    [status, orderId],
  );
};

export const cancelOrder = async (
  connection: PoolConnection,
  orderId: number,
  reason: string,
): Promise<void> => {
  await connection.execute(
    `UPDATE orders
     SET status = 'CANCELLED', cancel_reason = ?, cancelled_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [reason, orderId],
  );
};
