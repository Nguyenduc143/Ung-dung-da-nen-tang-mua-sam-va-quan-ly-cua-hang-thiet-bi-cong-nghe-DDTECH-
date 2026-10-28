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
      if (payload.ver !== user.auth_version) throw new Error('Revoked session');

      socket.data.user = { id: user.id, role: user.role, authVersion: user.auth_version };
      socket.data.tokenExpiresAt = payload.exp;
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

// Chat events only go to the owning customer and active admins. Recheck sessions
// before delivering private content, including sockets connected before logout-all.
export const emitChatEvent = async (customerId: number, event: string, data: unknown): Promise<void> => {
  if (!socketServer) return;
  const sockets = await socketServer.in([`user:${customerId}`, 'role:ADMIN']).fetchSockets();
  const users = new Map<number, Awaited<ReturnType<typeof findActiveUserById>>>();
  for (const socket of sockets) {
    const session = socket.data.user as { id: number; role: string; authVersion: number };
    if (!users.has(session.id)) users.set(session.id, await findActiveUserById(session.id));
    const user = users.get(session.id);
    if (!user || user.auth_version !== session.authVersion || user.role !== session.role ||
      (socket.data.tokenExpiresAt !== undefined && socket.data.tokenExpiresAt <= Date.now() / 1000) ||
      (user.role !== 'ADMIN' && user.id !== customerId)) {
      socket.disconnect(true);
      continue;
    }
    socket.emit(event, data);
  }
};
