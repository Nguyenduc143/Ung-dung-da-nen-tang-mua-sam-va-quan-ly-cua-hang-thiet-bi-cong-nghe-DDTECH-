import mysql, {
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise';
import type { ExecuteValues } from 'mysql2';

import { env } from './env';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: env.DB_QUEUE_LIMIT,
  charset: 'utf8mb4_unicode_ci',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export type DatabaseResult = RowDataPacket[] | RowDataPacket[][] | ResultSetHeader;

export const executeQuery = async <T extends DatabaseResult>(
  sql: string,
  values: ExecuteValues[] = [],
): Promise<T> => {
  const [result] = await pool.execute<T>(sql, values);
  return result;
};

export const testDatabaseConnection = async (): Promise<void> => {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 AS connection_test');

  if (rows[0]?.connection_test !== 1) {
    throw new Error('MySQL returned an unexpected response for SELECT 1');
  }
};

export const withTransaction = async <T>(
  operation: (connection: PoolConnection) => Promise<T>,
): Promise<T> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Failed to roll back MySQL transaction:', rollbackError);
    }

    throw error;
  } finally {
    connection.release();
  }
};

export const closeDatabasePool = async (): Promise<void> => {
  await pool.end();
};
