import type { ErrorRequestHandler, RequestHandler } from 'express';

interface HttpError extends Error {
  statusCode?: number;
  errors?: unknown;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy ${req.method} ${req.originalUrl}`,
    data: null,
  });
};

export const errorHandler: ErrorRequestHandler = (error: HttpError, _req, res, _next) => {
  const statusCode = error.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Lỗi máy chủ nội bộ' : error.message,
    data: null,
    ...(error.errors === undefined ? {} : { errors: error.errors }),
  });
};
