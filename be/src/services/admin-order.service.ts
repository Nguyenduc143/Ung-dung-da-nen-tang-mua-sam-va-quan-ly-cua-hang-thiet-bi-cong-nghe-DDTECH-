import { withTransaction } from '../config/database';
import * as orderStatusHistoryRepository from '../repositories/order-status-history.repository';
import * as orderRepository from '../repositories/order.repository';
import { emitToAdmins,emitToUser } from '../socket';
import { AppError } from '../utils/app-error';
import type {
AdminOrderQuery,
OrderStatus,
UpdateOrderStatusInput
} from '../validators/order.validator';
import { getOrderDetail } from './order.service';
import { cancelOrderTransaction,toOrderResponse } from './order.shared';
import * as paymentService from './payment.service';

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

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
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
    await orderStatusHistoryRepository.createStatusHistory(connection, {
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
