import nodemailer from 'nodemailer';
import { env } from '../config/env';

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    })
  : null;

export const canSendEmail = (): boolean => transporter !== null;

export const sendPasswordResetCode = async (
  recipient: { email: string; fullName: string },
  code: string,
): Promise<void> => {
  if (!transporter) {
    throw new Error('SMTP chưa được cấu hình');
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: recipient.email,
    subject: 'Mã đặt lại mật khẩu DDTECH',
    text: `Xin chào ${recipient.fullName}, mã đặt lại mật khẩu của bạn là ${code}. Mã có hiệu lực trong ${env.PASSWORD_RESET_EXPIRES_MINUTES} phút.`,
    html: `<p>Xin chào ${recipient.fullName},</p><p>Mã đặt lại mật khẩu DDTECH của bạn là:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Mã có hiệu lực trong ${env.PASSWORD_RESET_EXPIRES_MINUTES} phút. Không chia sẻ mã này với người khác.</p>`,
  });
};

export const sendRegistrationVerificationCode = async (
  recipient: { email: string; fullName: string },
  code: string,
): Promise<void> => {
  if (!transporter) {
    throw new Error('SMTP chưa được cấu hình');
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: recipient.email,
    subject: 'Xác nhận đăng ký tài khoản DDTECH',
    text: `Xin chào ${recipient.fullName}, mã xác nhận đăng ký DDTECH của bạn là ${code}. Mã có hiệu lực trong ${env.EMAIL_VERIFICATION_EXPIRES_MINUTES} phút.`,
    html: `<p>Xin chào ${recipient.fullName},</p><p>Mã xác nhận đăng ký tài khoản DDTECH của bạn là:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Mã có hiệu lực trong ${env.EMAIL_VERIFICATION_EXPIRES_MINUTES} phút. Không chia sẻ mã này với người khác.</p>`,
  });
};
