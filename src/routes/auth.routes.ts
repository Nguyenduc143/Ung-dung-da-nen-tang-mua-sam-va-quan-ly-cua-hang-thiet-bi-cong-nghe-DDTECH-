import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);
authRouter.post('/logout', validateBody(refreshTokenSchema), authController.logout);
authRouter.post('/logout-all', authenticate, authController.logoutAll);
authRouter.get('/me', authenticate, authController.me);
