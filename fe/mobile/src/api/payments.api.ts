import type { ApiResponse, CreatePaymentData, PaymentDetailData, PaymentRecord } from '@/types';
import { apiClient } from './axiosClient';

export const createPayment = async (orderId: number): Promise<PaymentRecord> => {
  const response = await apiClient.post<ApiResponse<CreatePaymentData>>(
    `/payments/${orderId}/create`,
    {},
  );
  return response.data.data.payment;
};

export const getPayment = async (orderId: number): Promise<PaymentDetailData> => {
  const response = await apiClient.get<ApiResponse<PaymentDetailData>>(`/payments/${orderId}`);
  return response.data.data;
};
