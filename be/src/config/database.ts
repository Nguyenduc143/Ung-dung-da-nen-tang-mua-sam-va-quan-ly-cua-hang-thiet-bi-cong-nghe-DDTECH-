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

type ProcedureExecutor = Pick<typeof pool, 'query'>;

interface ProcedureMutationRecord extends RowDataPacket {
  affectedRows: number;
  insertId: number;
}

const padDatePart = (value: number, width = 2): string => String(value).padStart(width, '0');

const formatMySqlDate = (value: Date): string => (
  `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`
  + ` ${padDatePart(value.getHours())}:${padDatePart(value.getMinutes())}`
  + `:${padDatePart(value.getSeconds())}.${padDatePart(value.getMilliseconds(), 3)}`
);

export const executeProcedure = async <T extends DatabaseResult>(
  executor: ProcedureExecutor,
  procedureName: string,
  values: ExecuteValues[] = [],
): Promise<[T, unknown]> => {
  if (!/^sp_[a-z0-9_]+$/.test(procedureName)) {
    throw new Error(`Invalid stored procedure name: ${procedureName}`);
  }

  const placeholders = values.map(() => '?').join(', ');
  const [rawResult, fields] = await executor.query(
    `CALL \`${procedureName}\`(${placeholders})`,
    values,
  );
  const resultSets = rawResult as unknown[];
  const firstResultSet = Array.isArray(resultSets[0]) ? resultSets[0] : [];
  const mutation = firstResultSet[0] as ProcedureMutationRecord | undefined;

  if (mutation && 'affectedRows' in mutation && 'insertId' in mutation) {
    return [{
      affectedRows: Number(mutation.affectedRows),
      insertId: Number(mutation.insertId),
      fieldCount: 0,
      info: '',
      serverStatus: 0,
      warningStatus: 0,
      changedRows: 0,
    } as T, fields];
  }

  return [firstResultSet as T, fields];
};

export const executeDynamicProcedure = async <T extends DatabaseResult>(
  executor: ProcedureExecutor,
  procedureName: string,
  sql: string,
  values: ExecuteValues[] = [],
): Promise<[T, unknown]> => {
  if (!/^sp_dynamic_[a-z0-9_]+$/.test(procedureName)) {
    throw new Error(`Invalid dynamic stored procedure name: ${procedureName}`);
  }
  const serializedValues = values.map((value) => {
    if (value instanceof Date) {
      return formatMySqlDate(value);
    }
    if (Buffer.isBuffer(value)) {
      return value.toString('base64');
    }
    return value;
  });
  const [rawResult, fields] = await executor.query(
    `CALL \`${procedureName}\`(?, ?)`,
    [sql, JSON.stringify(serializedValues)],
  );
  const sets = rawResult as unknown[];
  const read = /^\s*SELECT\s/i.test(sql);
  const rows = (read ? sets[0] : sets.find((item) => (
    Array.isArray(item) && item[0] && typeof item[0] === 'object' && 'affectedRows' in item[0]
  ))) as ProcedureMutationRecord[] | RowDataPacket[] | undefined;

  if (!read) {
    const mutation = rows?.[0] as ProcedureMutationRecord | undefined;
    return [{
      affectedRows: Number(mutation?.affectedRows ?? 0),
      insertId: Number(mutation?.insertId ?? 0),
      fieldCount: 0,
      info: '',
      serverStatus: 0,
      warningStatus: 0,
      changedRows: 0,
    } as T, fields];
  }
  return [(Array.isArray(rows) ? rows : []) as T, fields];
};

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
