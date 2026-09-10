import { createServer } from 'node:http';

import { app } from './app';
import { closeDatabasePool, testDatabaseConnection } from './config/database';
import { env } from './config/env';
import { initializeSocket } from './socket';

const httpServer = createServer(app);
const io = initializeSocket(httpServer);

const startServer = async (): Promise<void> => {
  try {
    await testDatabaseConnection();
    console.info(`MySQL connected: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);

    httpServer.listen(env.PORT, () => {
      console.info(`DDTECH API listening at http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error(
      `Unable to connect to MySQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}:`,
      error,
    );
    await closeDatabasePool().catch(() => undefined);
    process.exit(1);
  }
};

const shutdown = (signal: string): void => {
  console.info(`${signal} received. Shutting down gracefully...`);

  io.close(() => {
    httpServer.close(async (error) => {
      if (error) {
        console.error('Failed to close HTTP server:', error);
      }

      try {
        await closeDatabasePool();
      } catch (databaseError) {
        console.error('Failed to close MySQL pool:', databaseError);
        process.exit(1);
      }

      process.exit(error ? 1 : 0);
    });
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

void startServer();
