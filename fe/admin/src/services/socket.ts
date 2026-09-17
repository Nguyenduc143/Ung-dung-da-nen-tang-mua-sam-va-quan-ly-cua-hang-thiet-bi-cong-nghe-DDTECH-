import type { Socket } from 'socket.io-client';

let adminSocket: Socket | null = null;

export const registerAdminSocket = (socket: Socket): void => {
  adminSocket?.disconnect();
  adminSocket = socket;
};

export const disconnectAdminSocket = (): void => {
  adminSocket?.disconnect();
  adminSocket = null;
};
