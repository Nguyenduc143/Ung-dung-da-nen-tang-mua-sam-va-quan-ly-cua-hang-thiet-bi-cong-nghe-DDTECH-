import type { PoolConnection } from 'mysql2/promise';
import { withTransaction } from '../config/database';
import * as orderItemRepository from '../repositories/order-item.repository';
import * as orderStatusHistoryRepository from '../repositories/order-status-history.repository';
import * as orderRepository from '../repositories/order.repository';
import * as promotionUsageRepository from '../repositories/promotion-usage.repository';
import { AppError } from '../utils/app-error';

export const toOrderResponse = (order: orderRepository.OrderRecord) => ({
  id: order.id,
  orderCode: order.orderCode,
  userId: order.userId,
  customer: {
    id: order.userId,
    fullName: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone,
  },
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

export const restoreOrderInventory = async (
  connection: PoolConnection,
  order: orderRepository.OrderRecord,
  actorId: number,
): Promise<void> => {
  const items = await orderItemRepository.listOrderItems(order.id, connection);
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

export const cancelOrderTransaction = async (
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
  await orderStatusHistoryRepository.createStatusHistory(connection, {
    orderId: order.id,
    fromStatus: order.status,
    toStatus: 'CANCELLED',
    changedBy: actorId,
    note: reason,
  });
  if (order.promotionId !== null) {
    await orderRepository.lockPromotion(connection, order.promotionId);
    await promotionUsageRepository.releasePromotionUsage(connection, order.promotionId, order.id);
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
