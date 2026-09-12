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
  ADMIN_WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', z.flattenError(parsedEnv.error));
  throw new Error('Environment validation failed');
}

export const env = parsedEnv.data;
