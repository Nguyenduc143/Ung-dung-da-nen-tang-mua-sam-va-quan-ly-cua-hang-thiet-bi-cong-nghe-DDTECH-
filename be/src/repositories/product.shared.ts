import type { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/database';

export type Executor = typeof pool | PoolConnection;

export const toDatabaseValue = (key: string, value: unknown): unknown => {
  if (key === 'specifications' || key === 'attributes') {
    return value === null ? null : JSON.stringify(value);
  }
  if (key === 'hasVariants' || key === 'isFeatured' || key === 'isNew') {
    return value ? 1 : 0;
  }
  return value;
};
