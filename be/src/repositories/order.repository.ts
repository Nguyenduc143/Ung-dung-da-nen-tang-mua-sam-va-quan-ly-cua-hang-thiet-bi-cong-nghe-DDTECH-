import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeDynamicProcedure,executeProcedure,pool } from '../config/database';
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
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
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

export interface CartRecord extends RowDataPacket {
  id: number;
}

export interface CountRecord extends RowDataPacket {
  total: number;
}

export const ORDER_COLUMNS = `o.id, o.order_code AS orderCode, o.user_id AS userId,
  u.full_name AS customerName, u.email AS customerEmail, u.phone AS customerPhone,
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
  const [rows] = await executeProcedure<CartRecord[]>(connection, 'sp_order_findcartforupdate_1', [userId]);
  return rows[0]?.id ?? null;
};

export const listCartItemsForUpdate = async (
  connection: PoolConnection,
  cartId: number,
): Promise<CheckoutCartItemRecord[]> => {
  const [rows] = await executeProcedure<CheckoutCartItemRecord[]>(connection, 'sp_order_listcartitemsforupdate_1', [cartId]);
  return rows;
};

export const findProductForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<CheckoutProductRecord | null> => {
  const [rows] = await executeProcedure<CheckoutProductRecord[]>(connection, 'sp_order_findproductforupdate_1', [productId]);
  return rows[0] ?? null;
};

export const findVariantForUpdate = async (
  connection: PoolConnection,
  variantId: number,
): Promise<CheckoutVariantRecord | null> => {
  const [rows] = await executeProcedure<CheckoutVariantRecord[]>(connection, 'sp_order_findvariantforupdate_1', [variantId]);
  return rows[0] ?? null;
};

export const findProductImage = async (
  connection: PoolConnection,
  productId: number,
  variantId: number | null,
): Promise<string | null> => {
  const [rows] = await executeProcedure<Array<RowDataPacket & { imageUrl: string }>>(connection, 'sp_order_findproductimage_1', [productId, variantId]);
  return rows[0]?.imageUrl ?? null;
};

export const findOwnedAddress = async (
  connection: PoolConnection,
  userId: number,
  addressId: number,
): Promise<CheckoutAddressRecord | null> => {
  const [rows] = await executeProcedure<CheckoutAddressRecord[]>(connection, 'sp_order_findownedaddress_1', [addressId, userId]);
  return rows[0] ?? null;
};

export const findShippingMethodForUpdate = async (
  connection: PoolConnection,
  shippingMethodId: number,
): Promise<ShippingMethodRecord | null> => {
  const [rows] = await executeProcedure<ShippingMethodRecord[]>(connection, 'sp_order_findshippingmethodforupdate_1', [shippingMethodId]);
  return rows[0] ?? null;
};

export const lockPromotion = async (
  connection: PoolConnection,
  promotionId: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_lockpromotion_1', [promotionId]);
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
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_order_createorder_1', [
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
    ]);
  return result.insertId;
};

export const decreaseProductInventory = async (
  connection: PoolConnection,
  productId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_order_decreaseproductinventory_1', [quantity, quantity, productId, quantity]);
  return result.affectedRows > 0;
};

export const decreaseVariantInventory = async (
  connection: PoolConnection,
  variantId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_order_decreasevariantinventory_1', [quantity, quantity, variantId, quantity]);
  return result.affectedRows > 0;
};

export const restoreProductInventory = async (
  connection: PoolConnection,
  productId: number,
  quantity: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_restoreproductinventory_1', [quantity, quantity, productId]);
};

export const restoreVariantInventory = async (
  connection: PoolConnection,
  variantId: number,
  quantity: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_restorevariantinventory_1', [quantity, quantity, variantId]);
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
  await executeProcedure(connection, 'sp_order_createinventorytransaction_1', [
      data.productId,
      data.variantId,
      data.type,
      data.quantity,
      data.stockAfter,
      data.orderId,
      data.note,
      data.createdBy,
    ]);
};

export const clearCartItems = async (
  connection: PoolConnection,
  cartId: number,
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_clearcartitems_1', [cartId]);
  await executeProcedure(connection, 'sp_order_clearcartitems_2', [cartId]);
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
  await executeProcedure(connection, 'sp_order_createnotification_1', [data.userId, data.title, data.message, data.orderId]);
};

export const createAdminNotifications = async (
  connection: PoolConnection,
  data: { title: string; message: string; orderId: number },
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_createadminnotifications_1', [data.title, data.message, data.orderId]);
};

export const buildOrderFilters = (query: AdminOrderQuery | CustomerOrderQuery, userId?: number) => {
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
  const [orders] = await executeDynamicProcedure<OrderRecord[]>(pool, 'sp_dynamic_order_listorders_1', `SELECT ${ORDER_COLUMNS}
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN shipping_methods sm ON sm.id = o.shipping_method_id
     WHERE ${where}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ? OFFSET ?`, [...values, query.limit, offset]);
  const [countRows] = await executeDynamicProcedure<CountRecord[]>(pool, 'sp_dynamic_order_listorders_2', `SELECT COUNT(*) AS total FROM orders o WHERE ${where}`, values);
  return { orders, total: countRows[0]?.total ?? 0 };
};

export const findOrder = async (
  orderId: number,
  userId?: number,
): Promise<OrderRecord | null> => {
  const owner = userId === undefined ? '' : ' AND o.user_id = ?';
  const values = userId === undefined ? [orderId] : [orderId, userId];
  const [rows] = await executeDynamicProcedure<OrderRecord[]>(pool, 'sp_dynamic_order_findorder_1', `SELECT ${ORDER_COLUMNS}
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN shipping_methods sm ON sm.id = o.shipping_method_id
     WHERE o.id = ?${owner} LIMIT 1`, values);
  return rows[0] ?? null;
};

export const findOrderForUpdate = async (
  connection: PoolConnection,
  orderId: number,
  userId?: number,
): Promise<OrderRecord | null> => {
  const owner = userId === undefined ? '' : ' AND o.user_id = ?';
  const values = userId === undefined ? [orderId] : [orderId, userId];
  const [rows] = await executeDynamicProcedure<OrderRecord[]>(connection, 'sp_dynamic_order_findorderforupdate_1', `SELECT ${ORDER_COLUMNS}
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN shipping_methods sm ON sm.id = o.shipping_method_id
     WHERE o.id = ?${owner} LIMIT 1 FOR UPDATE`, values);
  return rows[0] ?? null;
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
  await executeDynamicProcedure(connection, 'sp_dynamic_order_updateorderstatus_1', `UPDATE orders SET ${timestampColumn[status] ?? ''} status = ? WHERE id = ?`, [status, orderId]);
};

export const cancelOrder = async (
  connection: PoolConnection,
  orderId: number,
  reason: string,
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_cancelorder_1', [reason, orderId]);
};
