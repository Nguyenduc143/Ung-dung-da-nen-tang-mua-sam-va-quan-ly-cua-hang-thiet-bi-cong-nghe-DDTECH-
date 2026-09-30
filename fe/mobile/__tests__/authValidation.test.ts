import {
  normalizeEmail,
  pickApiFieldErrors,
  toLoginInput,
  toRegisterInput,
  validateLoginForm,
  validateRegisterForm,
} from '@/utils/authValidation';

describe('auth validation', () => {
  test('chuẩn hóa email trước khi gửi đăng nhập', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
    expect(toLoginInput({ email: ' USER@Example.COM ', password: 'secret123' })).toEqual({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  test('báo lỗi thông tin đăng nhập không hợp lệ', () => {
    expect(validateLoginForm({ email: 'sai-email', password: '' })).toEqual({
      email: 'Email không hợp lệ.',
      password: 'Vui lòng nhập mật khẩu.',
    });
  });

  test('chấp nhận thông tin đăng ký hợp lệ và loại confirmPassword khỏi payload', () => {
    const values = {
      fullName: '  Nguyễn Văn An  ',
      email: ' AN@EXAMPLE.COM ',
      phone: '0901234567',
      password: '12345678',
      confirmPassword: '12345678',
    };

    expect(validateRegisterForm(values)).toEqual({});
    expect(toRegisterInput(values)).toEqual({
      fullName: 'Nguyễn Văn An',
      email: 'an@example.com',
      phone: '0901234567',
      password: '12345678',
    });
  });

  test('bắt mật khẩu xác nhận và số điện thoại sai', () => {
    const errors = validateRegisterForm({
      fullName: 'An',
      email: 'an@example.com',
      phone: '123',
      password: '12345678',
      confirmPassword: '87654321',
    });

    expect(errors.phone).toBeDefined();
    expect(errors.confirmPassword).toBe('Mật khẩu xác nhận không khớp.');
  });

  test('chỉ lấy lỗi field được cho phép từ API', () => {
    expect(pickApiFieldErrors(
      { email: ['Email đã tồn tại'], role: ['Không hợp lệ'] },
      ['email'] as const,
    )).toEqual({ email: 'Email đã tồn tại' });
  });
});
