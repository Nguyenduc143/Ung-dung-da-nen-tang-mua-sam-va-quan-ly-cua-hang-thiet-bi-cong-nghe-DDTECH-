import type { CreateAddressInput } from '@/types';

export type AddressFieldErrors = Partial<Record<keyof CreateAddressInput, string>>;

const phonePattern = /^(?:\+84|0)\d{9}$/;

export const validateAddressInput = (input: CreateAddressInput): AddressFieldErrors => {
  const errors: AddressFieldErrors = {};
  const receiverName = input.receiverName.trim();
  const receiverPhone = input.receiverPhone.trim();
  const province = input.province.trim();
  const district = input.district.trim();
  const ward = input.ward?.trim() ?? '';
  const addressLine = input.addressLine.trim();

  if (receiverName.length < 2) errors.receiverName = 'Họ tên phải có ít nhất 2 ký tự.';
  else if (receiverName.length > 100) errors.receiverName = 'Họ tên không được quá 100 ký tự.';

  if (!phonePattern.test(receiverPhone)) {
    errors.receiverPhone = 'Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có đủ 10 số.';
  }
  if (province.length < 2) errors.province = 'Vui lòng nhập tỉnh hoặc thành phố.';
  else if (province.length > 100) errors.province = 'Tỉnh/thành phố không được quá 100 ký tự.';
  if (district.length < 2) errors.district = 'Vui lòng nhập quận hoặc huyện.';
  else if (district.length > 100) errors.district = 'Quận/huyện không được quá 100 ký tự.';
  if (ward.length > 100) errors.ward = 'Phường/xã không được quá 100 ký tự.';
  if (addressLine.length < 3) errors.addressLine = 'Địa chỉ cụ thể phải có ít nhất 3 ký tự.';
  else if (addressLine.length > 255) errors.addressLine = 'Địa chỉ cụ thể không được quá 255 ký tự.';

  return errors;
};

export const normalizePhoneInput = (value: string): string => {
  const normalized = value.replace(/[^\d+]/g, '');
  return normalized.startsWith('+')
    ? `+${normalized.slice(1).replace(/\+/g, '')}`
    : normalized.replace(/\+/g, '');
};
