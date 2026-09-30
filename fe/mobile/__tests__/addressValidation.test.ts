import { normalizePhoneInput, validateAddressInput } from '@/utils/addressValidation';

const validAddress = {
  receiverName: 'Nguyễn Văn An',
  receiverPhone: '0901234567',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  ward: 'Dịch Vọng',
  addressLine: 'Số 1 Trần Thái Tông',
  addressType: 'HOME' as const,
  isDefault: true,
};

describe('address validation', () => {
  test('chấp nhận địa chỉ hợp lệ', () => {
    expect(validateAddressInput(validAddress)).toEqual({});
  });

  test('bắt các field bắt buộc và số điện thoại sai', () => {
    const errors = validateAddressInput({
      ...validAddress,
      receiverName: '',
      receiverPhone: '123',
      district: '',
      addressLine: '1',
    });

    expect(errors.receiverName).toBeDefined();
    expect(errors.receiverPhone).toBeDefined();
    expect(errors.district).toBeDefined();
    expect(errors.addressLine).toBeDefined();
  });

  test('chuẩn hóa số điện thoại người dùng nhập', () => {
    expect(normalizePhoneInput('+84 901-234-567')).toBe('+84901234567');
    expect(normalizePhoneInput('0901 234 567')).toBe('0901234567');
  });
});
