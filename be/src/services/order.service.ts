import { randomBytes } from 'node:crypto';
import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import * as orderRepository from '../repositories/order.repository';
import * as paymentService from './payment.service';
import * as promotionService from './promotion.service';
import { emitToAdmins, emitToUser } from '../socket';
import { AppError } from '../utils/app-error';
import type {
  AdminOrderQuery,
  CancelOrderInput,
  CheckoutInput,
  CustomerOrderQuery,
  OrderStatus,
  UpdateOrderStatusInput,
} from '../validators/order.validator';

const MAX_MONEY_CENTS = 999999999999999n;
const MAX_INVENTORY_QUANTITY = 2147483647;

interface ReceiverSnapshot {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
}

interface CheckoutItemSnapshot {
  productId: number;
  variantId: number | null;
  productName: string;
  productSku: string;
  productImage: string | null;
  variantName: string | null;
  originalPrice: string;
  price: string;
  priceCents: bigint;
  quantity: number;
  productStock: number;
  variantStock: number | null;
}

const moneyToCents = (value: string | number): bigint => {
  const normalized = String(value);
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
};

const centsToMoney = (value: bigint): string =>
  `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;

const ensureMoneyFitsDatabase = (value: bigint): void => {
  if (value < 0n || value > MAX_MONEY_CENTS) {
    throw new AppError(422, 'Giá trị đơn hàng vượt quá giới hạn cho phép');
  }
};

const formatCurrency = (cents: bigint): string =>
  `${Number(cents / 100n).toLocaleString('vi-VN')}đ`;

const generateOrderCode = (): string =>
  `DD${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`;

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const createOrderWithUniqueCode = async (
  connection: PoolConnection,
  data: Omit<Parameters<typeof orderRepository.createOrder>[1], 'orderCode'>,
): Promise<{ orderId: number; orderCode: string }> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const orderCode = generateOrderCode();
    try {
      const orderId = await orderRepository.createOrder(connection, { ...data, orderCode });
      return { orderId, orderCode };
    } catch (error) {
      if (!isDuplicateEntryError(error) || attempt === 2) throw error;
    }
  }
  throw new Error('Unique order code could not be generated');
};

const getReceiverSnapshot = async (
  connection: PoolConnection,
  userId: number,
  input: CheckoutInput,
): Promise<ReceiverSnapshot> => {
  let receiverName: string;
  let receiverPhone: string;
  let province: string;
  let district: string;
  let ward: string | null;
  let addressLine: string;

  if (input.addressId !== undefined) {
    const address = await orderRepository.findOwnedAddress(connection, userId, input.addressId);
    if (!address) throw new AppError(404, 'Không tìm thấy địa chỉ giao hàng');
    ({ receiverName, receiverPhone, province, district, ward, addressLine } = address);
  } else {
    receiverName = input.receiverName!;
    receiverPhone = input.receiverPhone!;
    province = input.province!;
    district = input.district!;
    ward = input.ward ?? null;
    addressLine = input.addressLine!;
  }

  const shippingAddress = [addressLine, ward, district, province].filter(Boolean).join(', ');
  if (shippingAddress.length > 500) {
    throw new AppError(422, 'Địa chỉ giao hàng không được vượt quá 500 ký tự');
  }
  return { receiverName, receiverPhone, shippingAddress };
};

const createCheckoutItemSnapshot = async (
  connection: PoolConnection,
  cartItem: orderRepository.CheckoutCartItemRecord,
): Promise<CheckoutItemSnapshot> => {
  if (cartItem.quantity > MAX_INVENTORY_QUANTITY) {
    throw new AppError(422, 'Số lượng sản phẩm vượt quá giới hạn xử lý kho');
  }

  const product = await orderRepository.findProductForUpdate(connection, cartItem.productId);
  if (!product) throw new AppError(404, 'Sản phẩm trong giỏ không còn tồn tại');
  if (product.status !== 'ACTIVE' || product.deletedAt !== null) {
    throw new AppError(409, `${product.name} hiện không khả dụng`);
  }

  let variant: orderRepository.CheckoutVariantRecord | null = null;
  if (product.hasVariants === 1) {
    if (cartItem.variantId === null) {
      throw new AppError(409, `${product.name} chưa chọn phiên bản`);
    }
    variant = await orderRepository.findVariantForUpdate(connection, cartItem.variantId);
    if (!variant || variant.productId !== product.id) {
      throw new AppError(409, `Phiên bản của ${product.name} không hợp lệ`);
    }
    if (variant.status !== 'ACTIVE') {
      throw new AppError(409, `${product.name} - ${variant.variantName} hiện không khả dụng`);
    }
    if (cartItem.quantity > variant.stock) {
      throw new AppError(409, `${product.name} - ${variant.variantName} không đủ tồn kho`, {
        requestedQuantity: cartItem.quantity,
        availableStock: variant.stock,
      });
    }
  } else {
    if (cartItem.variantId !== null) {
      throw new AppError(409, `Phiên bản của ${product.name} không hợp lệ`);
    }
    if (cartItem.quantity > product.stock) {
      throw new AppError(409, `${product.name} không đủ tồn kho`, {
        requestedQuantity: cartItem.quantity,
        availableStock: product.stock,
      });
    }
  }

  const originalPriceValue = variant?.price ?? product.price;
  const priceValue = variant
    ? (variant.salePrice ?? variant.price)
    : (product.salePrice ?? product.price);
  const productImage = variant?.imageUrl
    ?? await orderRepository.findProductImage(connection, product.id, variant?.id ?? null);

  return {
    productId: product.id,
    variantId: variant?.id ?? null,
    productName: product.name,
    productSku: variant?.sku ?? product.sku,
    productImage,
    variantName: variant?.variantName ?? null,
    originalPrice: centsToMoney(moneyToCents(originalPriceValue)),
    price: centsToMoney(moneyToCents(priceValue)),
    priceCents: moneyToCents(priceValue),
    quantity: cartItem.quantity,
    productStock: product.stock,
    variantStock: variant?.stock ?? null,
  };
};

const toOrderResponse = (order: orderRepository.OrderRecord) => ({
  id: order.id,
  orderCode: order.orderCode,
  userId: order.userId,
  receiverName: order.receiverName,
  receiverPhone: order.receiverPhone,
  shippingAddress: order.shippingAddress,
  shippingMethod: order.shippingMethodId === null
    ? null
    : {
        id: order.shippingMethodId,
        code: order.shippingMethodCode,
        name: order.shippingMethodName,
      },
  promotionId: order.promotionId,
  promotionCode: order.promotionCode,
  subtotal: Number(order.subtotal),
  shippingFee: Number(order.shippingFee),
  discountAmount: Number(order.discountAmount),
  totalAmount: Number(order.totalAmount),
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  status: order.status,
  note: order.note,
  cancelReason: order.cancelReason,
  confirmedAt: order.confirmedAt,
  deliveredAt: order.deliveredAt,
  cancelledAt: order.cancelledAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const toOrderItemResponse = (item: orderRepository.OrderItemRecord) => ({
  id: item.id,
  productId: item.productId,
  variantId: item.variantId,
  productName: item.productName,
  productSku: item.productSku,
  productImage: item.productImage,
  variantName: item.variantName,
  originalPrice: Number(item.originalPrice),
  price: Number(item.price),
  quantity: item.quantity,
  subtotal: Number(item.subtotal),
  createdAt: item.createdAt,
});

export const getOrderDetail = async (orderId: number, userId?: number) => {
  const order = await orderRepository.findOrder(orderId, userId);
  if (!order) throw new AppError(404, 'Không tìm thấy đơn hàng');
  const [items, statusHistory] = await Promise.all([
    orderRepository.listOrderItems(orderId),
    orderRepository.listStatusHistory(orderId),
  ]);
  return {
    order: toOrderResponse(order),
    items: items.map(toOrderItemResponse),
    statusHistory: statusHistory.map((history) => ({
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      changedBy: history.changedBy,
      changedByName: history.changedByName,
      note: history.note,
      createdAt: history.createdAt,
    })),
  };
};

export const listCustomerOrders = async (userId: number, query: CustomerOrderQuery) => {
  const result = await orderRepository.listOrders(query, userId);
  return {
    orders: result.orders.map(toOrderResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

export const listAdminOrders = async (query: AdminOrderQuery) => {
  const result = await orderRepository.listOrders(query);
  return {
    orders: result.orders.map(toOrderResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

export const checkout = async (userId: number, input: CheckoutInput) => {
  const created = await withTransaction(async (connection) => {
    const cartId = await orderRepository.findCartForUpdate(connection, userId);
    if (cartId === null) throw new AppError(409, 'Giỏ hàng đang trống');
    const cartItems = await orderRepository.listCartItemsForUpdate(connection, cartId);
    if (cartItems.length === 0) throw new AppError(409, 'Giỏ hàng đang trống');

    const receiver = await getReceiverSnapshot(connection, userId, input);
    const items: CheckoutItemSnapshot[] = [];
    let subtotalCents = 0n;
    for (const cartItem of cartItems) {
      const item = await createCheckoutItemSnapshot(connection, cartItem);
      const itemSubtotal = item.priceCents * BigInt(item.quantity);
      ensureMoneyFitsDatabase(itemSubtotal);
      subtotalCents += itemSubtotal;
      ensureMoneyFitsDatabase(subtotalCents);
      items.push(item);
    }

    const shippingMethod = await orderRepository.findShippingMethodForUpdate(
      connection,
      input.shippingMethodId,
    );
    if (!shippingMethod) throw new AppError(404, 'Phương thức vận chuyển không khả dụng');
    const baseFeeCents = moneyToCents(shippingMethod.baseFee);
    const shippingFeeCents = shippingMethod.freeThreshold !== null
      && subtotalCents >= moneyToCents(shippingMethod.freeThreshold)
      ? 0n
      : baseFeeCents;
    const { promotion, discountCents } = input.promotionCode
      ? await promotionService.validateForCheckout(
          connection,
          userId,
          input.promotionCode,
          subtotalCents,
        )
      : { promotion: null, discountCents: 0n };
    const totalCents = subtotalCents + shippingFeeCents - discountCents;
    ensureMoneyFitsDatabase(totalCents);

    const orderData = await createOrderWithUniqueCode(connection, {
      userId,
      ...receiver,
      shippingMethodId: shippingMethod.id,
      promotionId: promotion?.id ?? null,
      promotionCode: promotion?.code ?? null,
      subtotal: centsToMoney(subtotalCents),
      shippingFee: centsToMoney(shippingFeeCents),
      discountAmount: centsToMoney(discountCents),
      totalAmount: centsToMoney(totalCents),
      paymentMethod: input.paymentMethod,
      note: input.note ?? null,
    });

    for (const item of items) {
      await orderRepository.createOrderItem(connection, {
        orderId: orderData.orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSku: item.productSku,
        productImage: item.productImage,
        variantName: item.variantName,
        originalPrice: item.originalPrice,
        price: item.price,
        quantity: item.quantity,
      });

      if (item.variantId !== null) {
        const variantUpdated = await orderRepository.decreaseVariantInventory(
          connection,
          item.variantId,
          item.quantity,
        );
        const productUpdated = await orderRepository.decreaseProductInventory(
          connection,
          item.productId,
          item.quantity,
        );
        if (!variantUpdated || !productUpdated) {
          throw new AppError(409, `${item.productName} không đủ tồn kho`);
        }
      } else if (!await orderRepository.decreaseProductInventory(
        connection,
        item.productId,
        item.quantity,
      )) {
        throw new AppError(409, `${item.productName} không đủ tồn kho`);
      }

      await orderRepository.createInventoryTransaction(connection, {
        productId: item.productId,
        variantId: item.variantId,
        type: 'SALE',
        quantity: -item.quantity,
        stockAfter: (item.variantStock ?? item.productStock) - item.quantity,
        orderId: orderData.orderId,
        note: `Bán theo đơn ${orderData.orderCode}${item.variantName ? ` - ${item.variantName}` : ''}`,
        createdBy: userId,
      });
    }

    if (promotion) {
      await orderRepository.createPromotionUsage(
        connection,
        promotion.id,
        userId,
        orderData.orderId,
        centsToMoney(discountCents),
      );
    }
    await orderRepository.createStatusHistory(connection, {
      orderId: orderData.orderId,
      fromStatus: null,
      toStatus: 'PENDING',
      changedBy: userId,
      note: 'Khách đặt hàng',
    });
    await orderRepository.clearCartItems(connection, cartId);
    await orderRepository.createNotification(connection, {
      userId,
      title: 'Đặt hàng thành công',
      message: `Đơn hàng ${orderData.orderCode} đã được tạo, đang chờ xác nhận.`,
      orderId: orderData.orderId,
    });
    await orderRepository.createAdminNotifications(connection, {
      title: `Có đơn hàng mới #${orderData.orderCode}`,
      message: `Có đơn hàng ${orderData.orderCode} trị giá ${formatCurrency(totalCents)}.`,
      orderId: orderData.orderId,
    });
    return { ...orderData, totalAmount: Number(centsToMoney(totalCents)) };
  });

  const event = {
    orderId: created.orderId,
    orderCode: created.orderCode,
    userId,
    totalAmount: created.totalAmount,
    status: 'PENDING',
  };
  emitToUser(userId, 'order:created', event);
  emitToUser(userId, 'notification:new', {
    title: 'Đặt hàng thành công',
    message: `Đơn hàng ${created.orderCode} đã được tạo, đang chờ xác nhận.`,
    type: 'ORDER',
    referenceType: 'order',
    referenceId: created.orderId,
  });
  emitToAdmins('order:new', event);
  emitToAdmins('notification:new', {
    title: `Có đơn hàng mới #${created.orderCode}`,
    message: `Có đơn hàng ${created.orderCode} trị giá ${formatCurrency(moneyToCents(created.totalAmount))}.`,
    type: 'ORDER',
    referenceType: 'order',
    referenceId: created.orderId,
  });
  return getOrderDetail(created.orderId, userId);
};

const restoreOrderInventory = async (
  connection: PoolConnection,
  order: orderRepository.OrderRecord,
  actorId: number,
): Promise<void> => {
  const items = await orderRepository.listOrderItems(order.id, connection);
  for (const item of items) {
    if (item.productId === null) {
      throw new AppError(409, 'Không thể hoàn tồn kho vì sản phẩm của đơn hàng không còn tồn tại');
    }
    const product = await orderRepository.findProductForUpdate(connection, item.productId);
    if (!product) {
      throw new AppError(409, 'Không thể hoàn tồn kho vì sản phẩm của đơn hàng không còn tồn tại');
    }

    let stockAfter: number;
    if (item.variantName !== null) {
      if (item.variantId === null) {
        throw new AppError(409, 'Không thể hoàn tồn kho vì phiên bản sản phẩm không còn tồn tại');
      }
      const variant = await orderRepository.findVariantForUpdate(connection, item.variantId);
      if (!variant || variant.productId !== item.productId) {
        throw new AppError(409, 'Không thể hoàn tồn kho vì phiên bản sản phẩm không còn tồn tại');
      }
      await orderRepository.restoreVariantInventory(connection, item.variantId, item.quantity);
      await orderRepository.restoreProductInventory(connection, item.productId, item.quantity);
      stockAfter = variant.stock + item.quantity;
    } else {
      await orderRepository.restoreProductInventory(connection, item.productId, item.quantity);
      stockAfter = product.stock + item.quantity;
    }
    await orderRepository.createInventoryTransaction(connection, {
      productId: item.productId,
      variantId: item.variantId,
      type: 'CANCEL_ORDER',
      quantity: item.quantity,
      stockAfter,
      orderId: order.id,
      note: `Hoàn kho do hủy đơn ${order.orderCode}`,
      createdBy: actorId,
    });
  }
};

const cancelOrderTransaction = async (
  orderId: number,
  actorId: number,
  reason: string,
  ownerId?: number,
) => withTransaction(async (connection) => {
  const order = await orderRepository.findOrderForUpdate(connection, orderId, ownerId);
  if (!order) throw new AppError(404, 'Không tìm thấy đơn hàng');
  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    throw new AppError(409, 'Đơn hàng không thể hủy ở trạng thái hiện tại');
  }
  if (order.paymentStatus === 'PAID') {
    throw new AppError(409, 'Đơn hàng đã thanh toán cần được xử lý hoàn tiền trước khi hủy');
  }

  await restoreOrderInventory(connection, order, actorId);
  await orderRepository.cancelOrder(connection, order.id, reason);
  await orderRepository.createStatusHistory(connection, {
    orderId: order.id,
    fromStatus: order.status,
    toStatus: 'CANCELLED',
    changedBy: actorId,
    note: reason,
  });
  if (order.promotionId !== null) {
    await orderRepository.lockPromotion(connection, order.promotionId);
    await orderRepository.releasePromotionUsage(connection, order.promotionId, order.id);
  }
  await orderRepository.createNotification(connection, {
    userId: order.userId,
    title: 'Đơn hàng đã hủy',
    message: `Đơn hàng ${order.orderCode} đã được hủy.`,
    orderId: order.id,
  });
  await orderRepository.createAdminNotifications(connection, {
    title: `Đơn hàng ${order.orderCode} đã bị hủy`,
    message: `Đơn hàng ${order.orderCode} đã bị hủy.`,
    orderId: order.id,
  });
  return { orderId: order.id, orderCode: order.orderCode, userId: order.userId };
});

export const cancelCustomerOrder = async (
  userId: number,
  orderId: number,
  input: CancelOrderInput,
) => {
  const cancelled = await cancelOrderTransaction(orderId, userId, input.reason, userId);
  const event = { ...cancelled, status: 'CANCELLED' };
  emitToUser(cancelled.userId, 'order:updated', event);
  emitToUser(cancelled.userId, 'notification:new', {
    title: 'Đơn hàng đã hủy',
    message: `Đơn hàng ${cancelled.orderCode} đã được hủy.`,
    type: 'ORDER', referenceType: 'order', referenceId: cancelled.orderId,
  });
  emitToAdmins('order:cancelled', event);
  emitToAdmins('notification:new', {
    title: `Đơn hàng ${cancelled.orderCode} đã bị hủy`,
    message: `Đơn hàng ${cancelled.orderCode} đã bị hủy.`,
    type: 'ORDER', referenceType: 'order', referenceId: cancelled.orderId,
  });
  return getOrderDetail(orderId, userId);
};

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const updateOrderStatus = async (
  adminId: number,
  orderId: number,
  input: UpdateOrderStatusInput,
) => {
  if (input.status === 'CANCELLED') {
    const cancelled = await cancelOrderTransaction(
      orderId,
      adminId,
      input.note || 'Admin hủy đơn hàng',
    );
    const event = { ...cancelled, status: 'CANCELLED' };
    emitToUser(cancelled.userId, 'order:updated', event);
    emitToUser(cancelled.userId, 'notification:new', {
      title: 'Đơn hàng đã hủy',
      message: `Đơn hàng ${cancelled.orderCode} đã được hủy.`,
      type: 'ORDER', referenceType: 'order', referenceId: cancelled.orderId,
    });
    emitToAdmins('order:cancelled', event);
    emitToAdmins('notification:new', {
      title: `Đơn hàng ${cancelled.orderCode} đã bị hủy`,
      message: `Đơn hàng ${cancelled.orderCode} đã bị hủy.`,
      type: 'ORDER', referenceType: 'order', referenceId: cancelled.orderId,
    });
    return getOrderDetail(orderId);
  }

  const updated = await withTransaction(async (connection) => {
    const order = await orderRepository.findOrderForUpdate(connection, orderId);
    if (!order) throw new AppError(404, 'Không tìm thấy đơn hàng');
    if (!validTransitions[order.status].includes(input.status)) {
      throw new AppError(409, `Không thể chuyển trạng thái từ ${order.status} sang ${input.status}`);
    }
    await orderRepository.updateOrderStatus(connection, order.id, input.status);
    if (input.status === 'DELIVERED') {
      await paymentService.markCodPaidOnDelivery(connection, {
        id: order.id,
        orderCode: order.orderCode,
        userId: order.userId,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      });
    }
    await orderRepository.createStatusHistory(connection, {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: input.status,
      changedBy: adminId,
      note: input.note ?? null,
    });
    await orderRepository.createNotification(connection, {
      userId: order.userId,
      title: 'Trạng thái đơn hàng đã thay đổi',
      message: `Đơn hàng ${order.orderCode} đã chuyển sang trạng thái ${input.status}.`,
      orderId: order.id,
    });
    return {
      orderId: order.id,
      orderCode: order.orderCode,
      userId: order.userId,
      paymentUpdated: input.status === 'DELIVERED' && order.paymentMethod === 'COD',
    };
  });

  const event = {
    orderId: updated.orderId,
    orderCode: updated.orderCode,
    userId: updated.userId,
    status: input.status,
  };
  emitToUser(updated.userId, 'order:updated', event);
  emitToUser(updated.userId, 'notification:new', {
    title: 'Trạng thái đơn hàng đã thay đổi',
    message: `Đơn hàng ${updated.orderCode} đã chuyển sang trạng thái ${input.status}.`,
    type: 'ORDER', referenceType: 'order', referenceId: updated.orderId,
  });
  if (updated.paymentUpdated) {
    emitToUser(updated.userId, 'payment:updated', {
      orderId: updated.orderId,
      orderCode: updated.orderCode,
      method: 'COD',
      status: 'PAID',
    });
    emitToUser(updated.userId, 'notification:new', {
      title: 'Thanh toán thành công',
      message: `Đơn hàng ${updated.orderCode} đã được thanh toán bằng COD.`,
      type: 'PAYMENT', referenceType: 'order', referenceId: updated.orderId,
    });
  }
  emitToAdmins('order:updated', event);
  return getOrderDetail(orderId);
};
