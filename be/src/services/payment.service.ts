import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import { env } from '../config/env';
import * as paymentRepository from '../repositories/payment.repository';
import type { AuthenticatedUser } from '../types/auth';
import { emitToUser } from '../socket';
import { AppError } from '../utils/app-error';
import {
  addMinutes,
  buildVnpayUrl,
  createVnpayTransactionReference,
  formatVnpayDate,
  getOrderIdFromTransactionReference,
  verifyVnpaySignature,
  type VnpayParams,
} from '../utils/vnpay';

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

const getVnpayConfig = () => {
  if (!env.VNPAY_TMN_CODE || !env.VNPAY_HASH_SECRET) {
    throw new AppError(503, 'Cổng thanh toán VNPAY chưa được cấu hình');
  }
  return {
    tmnCode: env.VNPAY_TMN_CODE,
    secret: env.VNPAY_HASH_SECRET,
    paymentUrl: env.VNPAY_PAYMENT_URL,
    returnUrl: env.VNPAY_RETURN_URL,
  };
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

const getReusableVnpayUrl = (
  payment: paymentRepository.PaymentRecord,
  config: { tmnCode: string; returnUrl: string; paymentUrl: string },
): {
  paymentUrl: string;
  expiresAt: string;
} | null => {
  if (payment.status !== 'UNPAID') return null;
  const response = parseJson(payment.gatewayResponse);
  if (!response || typeof response !== 'object') return null;
  const paymentUrl = 'paymentUrl' in response ? response.paymentUrl : null;
  const expiresAt = 'expiresAt' in response ? response.expiresAt : null;
  const request = 'request' in response ? response.request : null;
  if (typeof paymentUrl !== 'string' || typeof expiresAt !== 'string') return null;
  if (!request || typeof request !== 'object'
    || !('vnp_TmnCode' in request) || request.vnp_TmnCode !== config.tmnCode
    || !('vnp_ReturnUrl' in request) || request.vnp_ReturnUrl !== config.returnUrl
    || !paymentUrl.startsWith(`${config.paymentUrl}?`)) {
    return null;
  }
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now() + 30_000) return null;
  return { paymentUrl, expiresAt };
};

export const createVnpayPayment = async (
  userId: number,
  orderId: number,
  ipAddress: string,
) => {
  const config = getVnpayConfig();
  const result = await withTransaction(async (connection) => {
    const order = await paymentRepository.findOrderForUpdate(connection, orderId);
    if (!order || order.userId !== userId) throw new AppError(404, 'Không tìm thấy đơn hàng');
    if (order.orderStatus === 'CANCELLED') {
      throw new AppError(409, 'Không thể thanh toán đơn hàng đã hủy');
    }
    if (order.paymentMethod !== 'VNPAY') {
      throw new AppError(409, 'Đơn hàng không sử dụng phương thức VNPAY');
    }
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
      throw new AppError(409, 'Đơn hàng đã được thanh toán');
    }

    const existing = await paymentRepository.findPaymentForUpdate(connection, order.id, 'VNPAY');
    if (existing) {
      ensurePaymentAmountMatches(existing, order);
      const reusable = getReusableVnpayUrl(existing, config);
      if (reusable) {
        return { paymentId: existing.id, created: false, ...reusable, orderCode: order.orderCode };
      }
    }

    const vnpAmount = moneyToCents(order.totalAmount);
    if (vnpAmount < 500_000n) {
      throw new AppError(422, 'VNPAY chỉ hỗ trợ giao dịch từ 5.000đ');
    }
    const now = new Date();
    const expiresAtDate = addMinutes(now, env.VNPAY_EXPIRE_MINUTES);
    const transactionCode = createVnpayTransactionReference(order.id, now);
    const params: VnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: vnpAmount.toString(),
      vnp_CreateDate: formatVnpayDate(now),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddress,
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: config.returnUrl,
      vnp_ExpireDate: formatVnpayDate(expiresAtDate),
      vnp_TxnRef: transactionCode,
    };
    const paymentUrl = buildVnpayUrl(config.paymentUrl, params, config.secret);
    const expiresAt = expiresAtDate.toISOString();
    const paymentId = await paymentRepository.createVnpayPayment(connection, {
      orderId: order.id,
      amount: order.totalAmount,
      transactionCode,
      gatewayResponse: {
        provider: 'VNPAY',
        paymentUrl,
        expiresAt,
        request: params,
      },
    });
    return { paymentId, created: true, paymentUrl, expiresAt, orderCode: order.orderCode };
  });

  const payment = await paymentRepository.findPayment(orderId, 'VNPAY');
  if (!payment || payment.id !== result.paymentId) throw new Error('VNPAY payment could not be loaded');
  if (result.created) {
    emitToUser(userId, 'payment:created', {
      paymentId: payment.id,
      orderId,
      orderCode: result.orderCode,
      method: 'VNPAY',
      status: payment.status,
    });
  }
  return {
    payment: toPaymentResponse(payment),
    created: result.created,
    paymentUrl: result.paymentUrl,
    expiresAt: result.expiresAt,
  };
};

export const createPayment = async (userId: number, orderId: number, ipAddress: string) => {
  const order = await paymentRepository.findOrder(orderId);
  if (!order || order.userId !== userId) throw new AppError(404, 'Không tìm thấy đơn hàng');
  if (order.paymentMethod === 'COD') return createCodPayment(userId, orderId);
  if (order.paymentMethod === 'VNPAY') return createVnpayPayment(userId, orderId, ipAddress);
  throw new AppError(501, `Cổng thanh toán ${order.paymentMethod} chưa được tích hợp`);
};

export interface VnpayIpnResult {
  RspCode: '00' | '01' | '02' | '04' | '97' | '99';
  Message: string;
}

export const processVnpayIpn = async (params: VnpayParams): Promise<VnpayIpnResult> => {
  let config: ReturnType<typeof getVnpayConfig>;
  try {
    config = getVnpayConfig();
  } catch {
    return { RspCode: '99', Message: 'VNPAY is not configured' };
  }
  if (!verifyVnpaySignature(params, config.secret) || params.vnp_TmnCode !== config.tmnCode) {
    return { RspCode: '97', Message: 'Invalid signature' };
  }

  const transactionCode = params.vnp_TxnRef;
  if (!transactionCode) return { RspCode: '01', Message: 'Order not found' };
  try {
    const result = await withTransaction(async (connection) => {
      const payment = await paymentRepository.findVnpayPaymentByTransactionForUpdate(
        connection,
        transactionCode,
      );
      if (!payment) return { response: { RspCode: '01', Message: 'Order not found' } as VnpayIpnResult };
      if (moneyToCents(payment.amount).toString() !== params.vnp_Amount) {
        return { response: { RspCode: '04', Message: 'Invalid amount' } as VnpayIpnResult };
      }
      if (payment.status !== 'UNPAID') {
        return { response: { RspCode: '02', Message: 'Order already confirmed' } as VnpayIpnResult };
      }

      const status = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00'
        ? 'PAID' as const
        : 'FAILED' as const;
      await paymentRepository.updateVnpayPaymentResult(connection, payment.id, status, params);
      await paymentRepository.updateOrderPaymentStatus(connection, payment.orderId, status);
      await paymentRepository.createPaymentNotification(connection, {
        userId: payment.userId,
        title: status === 'PAID' ? 'Thanh toán thành công' : 'Thanh toán không thành công',
        message: status === 'PAID'
          ? `Đơn hàng ${payment.orderCode} đã được thanh toán qua VNPAY.`
          : `Giao dịch VNPAY của đơn hàng ${payment.orderCode} không thành công.`,
        orderId: payment.orderId,
      });
      return {
        response: { RspCode: '00', Message: 'Confirm Success' } as VnpayIpnResult,
        event: { userId: payment.userId, paymentId: payment.id, orderId: payment.orderId, status },
      };
    });
    if (result.event) emitToUser(result.event.userId, 'payment:updated', result.event);
    return result.response;
  } catch (error) {
    console.error('VNPAY IPN processing failed:', error);
    return { RspCode: '99', Message: 'Unknown error' };
  }
};

export const getVnpayReturnRedirect = (params: VnpayParams): string => {
  const config = getVnpayConfig();
  const valid = verifyVnpaySignature(params, config.secret) && params.vnp_TmnCode === config.tmnCode;
  const successful = valid
    && params.vnp_ResponseCode === '00'
    && params.vnp_TransactionStatus === '00';
  const redirect = new URL(env.VNPAY_MOBILE_RETURN_URL);
  redirect.searchParams.set('status', valid ? (successful ? 'success' : 'failed') : 'invalid');
  const transactionReference = params.vnp_TxnRef;
  if (transactionReference) {
    redirect.searchParams.set('transactionRef', transactionReference);
    const orderId = getOrderIdFromTransactionReference(transactionReference);
    if (orderId) redirect.searchParams.set('orderId', String(orderId));
  }
  if (params.vnp_ResponseCode) redirect.searchParams.set('responseCode', params.vnp_ResponseCode);
  return redirect.toString();
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
