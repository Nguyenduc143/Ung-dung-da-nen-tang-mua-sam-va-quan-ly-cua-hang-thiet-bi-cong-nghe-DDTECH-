import type { ApiValidationErrors, LoginInput, RegisterInput } from '@/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(?:\+84|0)\d{9}$/;

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues extends RegisterInput {
  confirmPassword: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateLoginForm = (values: LoginFormValues): FormErrors<LoginFormValues> => {
  const errors: FormErrors<LoginFormValues> = {};
  const email = normalizeEmail(values.email);

  if (!email) errors.email = 'Vui lòng nhập email.';
  else if (email.length > 191 || !EMAIL_PATTERN.test(email)) errors.email = 'Email không hợp lệ.';

  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu.';
  else if (values.password.length > 72) errors.password = 'Mật khẩu không được vượt quá 72 ký tự.';

  return errors;
};

export const validateRegisterForm = (
  values: RegisterFormValues,
): FormErrors<RegisterFormValues> => {
  const errors: FormErrors<RegisterFormValues> = {};
  const fullName = values.fullName.trim();
  const email = normalizeEmail(values.email);
  const phone = values.phone.trim();

  if (fullName.length < 2) errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
  else if (fullName.length > 100) errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';

  if (!email) errors.email = 'Vui lòng nhập email.';
  else if (email.length > 191 || !EMAIL_PATTERN.test(email)) errors.email = 'Email không hợp lệ.';

  if (!phone) errors.phone = 'Vui lòng nhập số điện thoại.';
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Số điện thoại không hợp lệ.';

  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu.';
  else if (values.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
  else if (values.password.length > 72) errors.password = 'Mật khẩu không được vượt quá 72 ký tự.';

  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  return errors;
};

export const toLoginInput = (values: LoginFormValues): LoginInput => ({
  email: normalizeEmail(values.email),
  password: values.password,
});

export const toRegisterInput = (values: RegisterFormValues): RegisterInput => ({
  fullName: values.fullName.trim(),
  email: normalizeEmail(values.email),
  phone: values.phone.trim(),
  password: values.password,
});

export const pickApiFieldErrors = <Field extends string>(
  errors: ApiValidationErrors | undefined,
  allowedFields: readonly Field[],
): Partial<Record<Field, string>> => {
  const result: Partial<Record<Field, string>> = {};
  for (const field of allowedFields) {
    const firstMessage = errors?.[field]?.[0];
    if (firstMessage) result[field] = firstMessage;
  }
  return result;
};
