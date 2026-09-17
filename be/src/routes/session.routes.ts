import { Router } from 'express';
import { env } from '../config/env';
import * as sessionController from '../controllers/session.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimit } from '../middleware/rateLimit.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
refreshTokenSchema
} from '../validators/auth.validator';
export const sessionRouter = Router();
const refreshRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_REFRESH_RATE_LIMIT_MAX,
  message: 'Bạn đã làm mới token quá nhiều lần, vui lòng thử lại sau',
});
sessionRouter.post(
  '/refresh-token',
  refreshRateLimit,
  validateBody(refreshTokenSchema),
  sessionController.refreshToken,
);
sessionRouter.post('/logout', validateBody(refreshTokenSchema), sessionController.logout);
sessionRouter.post('/logout-all', authenticate, sessionController.logoutAll);
