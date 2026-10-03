import { AxiosError } from 'axios';

import { getApiErrorMessage } from '@/api/axiosClient';

describe('API error messages', () => {
  test('phân biệt lỗi mất kết nối', () => {
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    expect(getApiErrorMessage(error)).toBe(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
    );
  });

  test('phân biệt request quá thời gian', () => {
    const error = new AxiosError('timeout', AxiosError.ECONNABORTED);
    expect(getApiErrorMessage(error)).toBe('Kết nối quá thời gian. Vui lòng thử lại.');
  });

  test('ưu tiên message do backend trả về', () => {
    const error = new AxiosError(
      'Bad request',
      AxiosError.ERR_BAD_REQUEST,
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: {} } as never,
        data: { success: false, message: 'Voucher đã hết hạn' },
      },
    );
    expect(getApiErrorMessage(error)).toBe('Voucher đã hết hạn');
  });
});
