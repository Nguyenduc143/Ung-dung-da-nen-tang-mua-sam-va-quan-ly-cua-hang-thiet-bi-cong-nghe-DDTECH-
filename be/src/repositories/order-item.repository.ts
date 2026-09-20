import type { PoolConnection,RowDataPacket } from 'mysql2/promise';
import { executeProcedure,pool } from '../config/database';

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
  await executeProcedure(connection, 'sp_order_createorderitem_1', [
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
    ]);
};

export const listOrderItems = async (
  orderId: number,
  connection?: PoolConnection,
): Promise<OrderItemRecord[]> => {
  const executor = connection ?? pool;
  const [rows] = await executeProcedure<OrderItemRecord[]>(executor, 'sp_order_listorderitems_1', [orderId]);
  return rows;
};
