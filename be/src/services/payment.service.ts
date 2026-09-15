import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import * as paymentRepository from '../repositories/payment.repository';
import type { AuthenticatedUser } from '../types/auth';
import { emitToUser } from '../socket';
import { AppError } from '../utils/app-error';

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const moneyToCents = (value: string | number): bigint => {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
};

const ensurePaymentAmountMatches = (
  payment: paymentRepository.PaymentRecord,
  order: { totalAmount: string | number },
): void => {
  if (moneyToCents(payment.amount) !== moneyToCents(order.totalAmount)) {
    throw new AppError(409, 'Số tiền thanh toán không khớp với tổng tiền đơn hàng');
  }
};

const toPaymentResponse = (payment: paymentRepository.PaymentRecord) => ({
  id: payment.id,
  orderId: payment.orderId,
  method: payment.method,
  status: payment.status,
  amount: Number(payment.amount),
  transactionCode: payment.transactionCode,
  gatewayResponse: parseJson(payment.gatewayResponse),
  paidAt: payment.paidAt,
  refundedAt: payment.refundedAt,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const toOrderPaymentResponse = (order: paymentRepository.PaymentOrderRecord) => ({
  id: order.id,
  orderCode: order.orderCode,
  totalAmount: Number(order.totalAmount),
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
});

export const getPayment = async (authUser: AuthenticatedUser, orderId: number) => {
  const order = await paymentRepository.findOrder(orderId);
  if (!order || (authUser.role !== 'ADMIN' && order.userId !== authUser.id)) {
    throw new AppError(404, 'Không tìm thấy đơn hàng');
  }
  const payment = await paymentRepository.findPayment(orderId, order.paymentMethod);
  if (!payment) throw new AppError(404, 'Đơn hàng chưa có thông tin thanh toán');
  ensurePaymentAmountMatches(payment, order);
  return {
    order: toOrderPaymentResponse(order),
    payment: toPaymentResponse(payment),
  };
};

export const createCodPayment = async (userId: number, orderId: number) => {
  const result = await withTransaction(async (connection) => {
    const order = await paymentRepository.findOrderForUpdate(connection, orderId);
    if (!order || order.userId !== userId) throw new AppError(404, 'Không tìm thấy đơn hàng');
    if (order.orderStatus === 'CANCELLED') {
      throw new AppError(409, 'Không thể tạo thanh toán cho đơn hàng đã hủy');
    }
    if (order.paymentMethod !== 'COD') {
      throw new AppError(501, `Cổng thanh toán ${order.paymentMethod} chưa được tích hợp`);
    }

    const existing = await paymentRepository.findPaymentForUpdate(
      connection,
      order.id,
      'COD',
    );
    if (existing) {
      ensurePaymentAmountMatches(existing, order);
      if (existing.status !== order.paymentStatus) {
        if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
          await paymentRepository.updatePaymentStatus(connection, existing.id, order.paymentStatus);
        } else {
          await paymentRepository.updateOrderPaymentStatus(connection, order.id, existing.status);
        }
      }
      return { paymentId: existing.id, created: false };
    }

    const paymentId = await paymentRepository.createPayment(connection, {
      orderId: order.id,
      method: 'COD',
      status: order.paymentStatus,
      amount: order.totalAmount,
    });
    await paymentRepository.updateOrderPaymentStatus(connection, order.id, order.paymentStatus);
    return { paymentId, created: true, orderCode: order.orderCode };
  });

  const payment = await paymentRepository.findPayment(orderId, 'COD');
  if (!payment || payment.id !== result.paymentId) {
    throw new Error('COD payment could not be loaded');
  }
  if (result.created) {
    emitToUser(userId, 'payment:created', {
      paymentId: payment.id,
      orderId,
      orderCode: result.orderCode,
      method: 'COD',
      status: payment.status,
    });
  }
  return { payment: toPaymentResponse(payment), created: result.created };
};

export const markCodPaidOnDelivery = async (
  connection: PoolConnection,
  order: {
    id: number;
    orderCode: string;
    userId: number;
    totalAmount: string | number;
    paymentMethod: paymentRepository.PaymentMethod;
    paymentStatus: paymentRepository.PaymentStatus;
  },
): Promise<void> => {
  if (order.paymentMethod !== 'COD') return;
  if (order.paymentStatus === 'REFUNDED') {
    throw new AppError(409, 'Không thể giao đơn hàng đã hoàn tiền');
  }

  const existing = await paymentRepository.findPaymentForUpdate(connection, order.id, 'COD');
  if (existing) {
    ensurePaymentAmountMatches(existing, order);
    if (existing.status === 'REFUNDED') {
      throw new AppError(409, 'Không thể giao đơn hàng đã hoàn tiền');
    }
    if (existing.status !== 'PAID') {
      await paymentRepository.updatePaymentStatus(connection, existing.id, 'PAID');
    }
  } else {
    await paymentRepository.createPayment(connection, {
      orderId: order.id,
      method: 'COD',
      status: 'PAID',
      amount: order.totalAmount,
    });
  }
  if (order.paymentStatus !== 'PAID') {
    await paymentRepository.updateOrderPaymentStatus(connection, order.id, 'PAID');
    await paymentRepository.createPaymentNotification(connection, {
      userId: order.userId,
      title: 'Thanh toán thành công',
      message: `Đơn hàng ${order.orderCode} đã được thanh toán bằng COD.`,
      orderId: order.id,
    });
  }
};
