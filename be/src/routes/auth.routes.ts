import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimit } from '../middleware/rateLimit.middleware';
import { env } from '../config/env';
import { validateBody } from '../middleware/validate.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validators/auth.validator';

export const authRouter = Router();

const loginRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_LOGIN_RATE_LIMIT_MAX,
  message: 'Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau',
});

const refreshRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_REFRESH_RATE_LIMIT_MAX,
  message: 'Bạn đã làm mới token quá nhiều lần, vui lòng thử lại sau',
});

authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post('/login', loginRateLimit, validateBody(loginSchema), authController.login);
authRouter.post(
  '/refresh-token',
  refreshRateLimit,
  validateBody(refreshTokenSchema),
  authController.refreshToken,
);
authRouter.post('/logout', validateBody(refreshTokenSchema), authController.logout);
authRouter.post('/logout-all', authenticate, authController.logoutAll);
authRouter.get('/me', authenticate, authController.me);
