import type { PoolConnection,RowDataPacket } from 'mysql2/promise';
import { executeProcedure,pool } from '../config/database';
import type {
OrderStatus
} from '../validators/order.validator';

export interface OrderStatusHistoryRecord extends RowDataPacket {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: number | null;
  changedByName: string | null;
  note: string | null;
  createdAt: Date;
}

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
  await executeProcedure(connection, 'sp_order_createstatushistory_1', [data.orderId, data.fromStatus, data.toStatus, data.changedBy, data.note]);
};

export const listStatusHistory = async (
  orderId: number,
): Promise<OrderStatusHistoryRecord[]> => {
  const [rows] = await executeProcedure<OrderStatusHistoryRecord[]>(pool, 'sp_order_liststatushistory_1', [orderId]);
  return rows;
};
