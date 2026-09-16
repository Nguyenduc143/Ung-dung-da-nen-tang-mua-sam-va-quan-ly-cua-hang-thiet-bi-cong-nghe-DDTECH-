import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';

export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface PaymentOrderRecord extends RowDataPacket {
  id: number;
  orderCode: string;
  userId: number;
  totalAmount: string | number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
}

export interface PaymentRecord extends RowDataPacket {
  id: number;
  orderId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string | number;
  transactionCode: string | null;
  gatewayResponse: unknown;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PAYMENT_COLUMNS = `id, order_id AS orderId, method, status, amount,
  transaction_code AS transactionCode, gateway_response AS gatewayResponse,
  paid_at AS paidAt, refunded_at AS refundedAt,
  created_at AS createdAt, updated_at AS updatedAt`;

export const findOrderForUpdate = async (
  connection: PoolConnection,
  orderId: number,
): Promise<PaymentOrderRecord | null> => {
  const [rows] = await executeProcedure<PaymentOrderRecord[]>(connection, 'sp_payment_findorderforupdate_1', [orderId]);
  return rows[0] ?? null;
};

export const findOrder = async (orderId: number): Promise<PaymentOrderRecord | null> => {
  const [rows] = await executeProcedure<PaymentOrderRecord[]>(pool, 'sp_payment_findorder_1', [orderId]);
  return rows[0] ?? null;
};

export const findPayment = async (
  orderId: number,
  method?: PaymentMethod,
): Promise<PaymentRecord | null> => {
  const methodFilter = method === undefined ? '' : ' AND method = ?';
  const values = method === undefined ? [orderId] : [orderId, method];
  const [rows] = await executeDynamicProcedure<PaymentRecord[]>(pool, 'sp_dynamic_payment_findpayment_1', `SELECT ${PAYMENT_COLUMNS} FROM payments
     WHERE order_id = ?${methodFilter}
     ORDER BY id DESC LIMIT 1`, values);
  return rows[0] ?? null;
};

export const findPaymentForUpdate = async (
  connection: PoolConnection,
  orderId: number,
  method: PaymentMethod,
): Promise<PaymentRecord | null> => {
  const [rows] = await executeProcedure<PaymentRecord[]>(connection, 'sp_payment_findpaymentforupdate_1', [orderId, method]);
  return rows[0] ?? null;
};

export const createPayment = async (
  connection: PoolConnection,
  data: {
    orderId: number;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: string | number;
  },
): Promise<number> => {
  const paidAt = data.status === 'PAID' ? new Date() : null;
  const refundedAt = data.status === 'REFUNDED' ? new Date() : null;
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_payment_createpayment_1', [data.orderId, data.method, data.status, data.amount, paidAt, refundedAt]);
  return result.insertId;
};

export const updatePaymentStatus = async (
  connection: PoolConnection,
  paymentId: number,
  status: PaymentStatus,
): Promise<void> => {
  const timestamps: Partial<Record<PaymentStatus, string>> = {
    PAID: 'paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),',
    REFUNDED: 'refunded_at = COALESCE(refunded_at, CURRENT_TIMESTAMP),',
  };
  await executeDynamicProcedure(connection, 'sp_dynamic_payment_updatepaymentstatus_1', `UPDATE payments SET ${timestamps[status] ?? ''} status = ? WHERE id = ?`, [status, paymentId]);
};

export const updateOrderPaymentStatus = async (
  connection: PoolConnection,
  orderId: number,
  status: PaymentStatus,
): Promise<void> => {
  await executeProcedure(connection, 'sp_payment_updateorderpaymentstatus_1', [status, orderId]);
};

export const createPaymentNotification = async (
  connection: PoolConnection,
  data: { userId: number; title: string; message: string; orderId: number },
): Promise<void> => {
  await executeProcedure(connection, 'sp_payment_createpaymentnotification_1', [data.userId, data.title, data.message, data.orderId]);
};
