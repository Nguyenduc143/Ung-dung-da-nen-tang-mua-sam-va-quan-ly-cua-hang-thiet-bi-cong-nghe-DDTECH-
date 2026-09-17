import { Router } from 'express';
import { env } from '../config/env';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimit } from '../middleware/rateLimit.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
loginSchema,
registerSchema
} from '../validators/auth.validator';
import { sessionRouter } from './session.routes';
export const authRouter = Router();
const loginRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_LOGIN_RATE_LIMIT_MAX,
  message: 'Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau',
});

authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post('/login', loginRateLimit, validateBody(loginSchema), authController.login);
authRouter.use(sessionRouter);


authRouter.get('/me', authenticate, authController.me);
