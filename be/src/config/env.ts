import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().max(65535).default(3306),
  DB_USER: z.string().min(1).default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1).default('ddtech'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().max(100).default(10),
  DB_QUEUE_LIMIT: z.coerce.number().int().nonnegative().default(0),
  JWT_ACCESS_SECRET: z.string().min(1).default('change_me'),
  JWT_REFRESH_SECRET: z.string().min(1).default('change_me'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('30d'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().max(86400000).default(900000),
  AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1000).default(10),
  AUTH_REFRESH_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1000).default(30),
  AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(100).default(5),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().positive().max(60).default(10),
  EMAIL_VERIFICATION_EXPIRES_MINUTES: z.coerce.number().int().positive().max(60).default(10),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).default('DDTECH <no-reply@ddtech.local>'),
  ADMIN_WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  VNPAY_TMN_CODE: z.string().regex(/^[A-Za-z0-9]{8}$/).optional(),
  VNPAY_HASH_SECRET: z.string().min(1).optional(),
  VNPAY_PAYMENT_URL: z.string().url().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNPAY_RETURN_URL: z.string().url().default('http://localhost:5000/api/payments/vnpay/return'),
  VNPAY_MOBILE_RETURN_URL: z.string().min(1).default('ddtech://payment-result'),
  VNPAY_EXPIRE_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
}).superRefine((data, context) => {
  if (data.NODE_ENV !== 'production') return;

  for (const field of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (data[field] === 'change_me' || data[field].length < 32) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} phải khác giá trị mặc định và có ít nhất 32 ký tự ở production`,
      });
    }
  }
  if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
    context.addIssue({
      code: 'custom',
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT access secret và refresh secret phải khác nhau ở production',
    });
  }
  for (const field of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'] as const) {
    if (!data[field]) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} là bắt buộc ở production để gửi mã đặt lại mật khẩu`,
      });
    }
  }
  for (const field of ['VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET'] as const) {
    if (!data[field]) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} là bắt buộc ở production để thanh toán VNPAY`,
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', z.flattenError(parsedEnv.error));
  throw new Error('Environment validation failed');
}

export const env = parsedEnv.data;
