import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from '../api/authSession';

const socketUrl = import.meta.env.VITE_SOCKET_URL?.replace(/\/+$/, '');

if (!socketUrl) throw new Error('Thiếu biến môi trường VITE_SOCKET_URL');

let adminSocket: Socket | null = null;

export const getAdminSocket = (accessToken: string): Socket => {
  if (!adminSocket) {
    adminSocket = io(socketUrl, {
      autoConnect: false,
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 10_000,
    });
    adminSocket.io.on('reconnect_attempt', () => {
      if (adminSocket) adminSocket.auth = { token: getAccessToken() ?? accessToken };
    });
  } else {
    adminSocket.auth = { token: getAccessToken() ?? accessToken };
  }
  return adminSocket;
};

export const connectAdminSocket = (accessToken: string): Socket => {
  const socket = getAdminSocket(accessToken);
  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectAdminSocket = (): void => {
  adminSocket?.removeAllListeners();
  adminSocket?.disconnect();
  adminSocket = null;
};
