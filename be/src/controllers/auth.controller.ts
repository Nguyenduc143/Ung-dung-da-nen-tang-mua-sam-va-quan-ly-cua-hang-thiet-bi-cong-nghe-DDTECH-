import type { RequestHandler } from 'express';

import * as authService from '../services/auth.service';
import * as passwordResetService from '../services/passwordReset.service';
import * as emailVerificationService from '../services/emailVerification.service';
import { AppError } from '../utils/app-error';
import type {
LoginInput,
RegisterInput,
ForgotPasswordInput,
ResetPasswordInput
,
RegistrationEmailInput,
VerifyRegistrationInput
} from '../validators/auth.validator';

const getClientMetadata = (req: Parameters<RequestHandler>[0]) => ({
  userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
  ipAddress: req.ip?.slice(0, 45) ?? null,
});

export const register: RequestHandler = async (req, res) => {
  const data = await authService.register(req.body as RegisterInput);
  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công. Vui lòng kiểm tra Gmail để xác nhận tài khoản',
    data,
  });
};

export const resendRegistrationCode: RequestHandler = async (req, res) => {
  const data = await emailVerificationService.sendVerificationCode(
    req.body as RegistrationEmailInput,
  );
  res.status(200).json({
    success: true,
    message: 'Nếu tài khoản đang chờ xác nhận, mã mới đã được gửi tới Gmail',
    data,
  });
};

export const verifyRegistration: RequestHandler = async (req, res) => {
  await emailVerificationService.verifyRegistration(req.body as VerifyRegistrationInput);
  res.status(200).json({
    success: true,
    message: 'Xác nhận email thành công. Bạn có thể đăng nhập',
    data: null,
  });
};

export const login: RequestHandler = async (req, res) => {
  const data = await authService.login(req.body as LoginInput, getClientMetadata(req));
  res.status(200).json({ success: true, message: 'Đăng nhập thành công', data });
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const data = await passwordResetService.requestPasswordReset(req.body as ForgotPasswordInput);
  res.status(200).json({
    success: true,
    message: 'Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi',
    data,
  });
};

export const resetPassword: RequestHandler = async (req, res) => {
  await passwordResetService.resetPassword(req.body as ResetPasswordInput);
  res.status(200).json({
    success: true,
    message: 'Đặt lại mật khẩu thành công',
    data: null,
  });
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Bạn chưa đăng nhập');
  }

  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, message: 'Lấy thông tin tài khoản thành công', data: { user } });
};
