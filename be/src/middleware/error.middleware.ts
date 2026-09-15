import type { ErrorRequestHandler } from 'express';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
  errors?: unknown;
}

const resolveError = (error: HttpError) => {
  if (error.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'JSON không hợp lệ' };
  }
  if (error.type === 'entity.too.large') {
    return { statusCode: 413, message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép' };
  }
  const candidate = error.statusCode ?? error.status ?? 500;
  const statusCode = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599
    ? candidate
    : 500;
  return {
    statusCode,
    message: statusCode >= 500 ? 'Lỗi máy chủ nội bộ' : error.message,
  };
};

export const errorHandler: ErrorRequestHandler = (error: HttpError, _req, res, _next) => {
  const resolved = resolveError(error);
  if (resolved.statusCode >= 500) console.error(error);

  res.status(resolved.statusCode).json({
    success: false,
    message: resolved.message,
    data: null,
    ...(error.errors === undefined ? {} : { errors: error.errors }),
  });
};
