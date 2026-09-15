import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';

import { AppError } from '../utils/app-error';

export const validateBody = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    next(new AppError(422, 'Dữ liệu không hợp lệ', z.flattenError(result.error).fieldErrors));
    return;
  }

  req.body = result.data;
  next();
};

export const validateParams = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    next(new AppError(422, 'Tham số đường dẫn không hợp lệ', z.flattenError(result.error).fieldErrors));
    return;
  }

  req.params = result.data as Record<string, string>;
  next();
};
