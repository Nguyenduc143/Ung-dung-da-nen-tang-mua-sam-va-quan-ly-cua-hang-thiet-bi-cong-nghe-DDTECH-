import morgan from 'morgan';
import type { Request } from 'express';

// Omit query strings so secrets accidentally sent in a URL are never written to access logs.
morgan.token('safe-url', (req) => (req as Request).originalUrl.split('?')[0]);

export const requestLogger = morgan(
  ':remote-addr - :method :safe-url HTTP/:http-version :status :res[content-length] - :response-time ms',
);
