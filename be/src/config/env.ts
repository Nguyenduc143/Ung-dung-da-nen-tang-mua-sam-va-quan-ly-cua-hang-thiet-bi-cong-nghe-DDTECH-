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
  ADMIN_WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', z.flattenError(parsedEnv.error));
  throw new Error('Environment validation failed');
}

export const env = parsedEnv.data;
