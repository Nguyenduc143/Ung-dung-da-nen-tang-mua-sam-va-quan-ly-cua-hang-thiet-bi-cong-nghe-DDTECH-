import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';

import { isOriginAllowed } from '../config/cors';
import { findActiveUserById } from '../repositories/auth.repository';
import { verifyAccessToken } from '../utils/token';

let socketServer: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    },
  });
  socketServer = io;

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth.token ?? socket.handshake.auth.accessToken;
      const authorization = socket.handshake.headers.authorization;
      const token = typeof authToken === 'string'
        ? authToken.trim()
        : typeof authorization === 'string' && authorization.startsWith('Bearer ')
          ? authorization.slice(7).trim()
          : '';
      if (!token) throw new Error('Missing access token');

      const payload = verifyAccessToken(token);
      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('Invalid user id');
      const user = await findActiveUserById(userId);
      if (!user) throw new Error('Inactive user');

      socket.data.user = { id: user.id, role: user.role };
      next();
    } catch {
      next(new Error('Access token không hợp lệ, đã hết hạn hoặc tài khoản không hoạt động'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: number; role: 'CUSTOMER' | 'ADMIN' };
    void socket.join(`user:${user.id}`);
    if (user.role === 'ADMIN') void socket.join('role:ADMIN');
    console.info(`Socket connected: ${socket.id} (user:${user.id})`);

    socket.on('disconnect', (reason) => {
      console.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const emitToUser = (userId: number, event: string, data: unknown): void => {
  socketServer?.to(`user:${userId}`).emit(event, data);
};

export const emitToAdmins = (event: string, data: unknown): void => {
  socketServer?.to('role:ADMIN').emit(event, data);
};

export const emitToAll = (event: string, data: unknown): void => {
  socketServer?.emit(event, data);
};
