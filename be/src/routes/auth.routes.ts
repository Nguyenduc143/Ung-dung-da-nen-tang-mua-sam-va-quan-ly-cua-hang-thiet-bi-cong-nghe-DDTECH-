import { Router } from 'express';
import { env } from '../config/env';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimit } from '../middleware/rateLimit.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
forgotPasswordSchema,
loginSchema,
registerSchema,
resetPasswordSchema,
registrationEmailSchema,
verifyRegistrationSchema
} from '../validators/auth.validator';
import { sessionRouter } from './session.routes';
export const authRouter = Router();
const loginRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_LOGIN_RATE_LIMIT_MAX,
  message: 'Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau',
});
const forgotPasswordRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX,
  message: 'Bạn đã yêu cầu quá nhiều mã, vui lòng thử lại sau',
});
const registrationVerificationRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX,
  message: 'Bạn đã yêu cầu xác nhận quá nhiều lần, vui lòng thử lại sau',
});

authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post(
  '/resend-registration-code',
  registrationVerificationRateLimit,
  validateBody(registrationEmailSchema),
  authController.resendRegistrationCode,
);
authRouter.post(
  '/verify-registration',
  registrationVerificationRateLimit,
  validateBody(verifyRegistrationSchema),
  authController.verifyRegistration,
);
authRouter.post('/login', loginRateLimit, validateBody(loginSchema), authController.login);
authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);
authRouter.post(
  '/reset-password',
  forgotPasswordRateLimit,
  validateBody(resetPasswordSchema),
  authController.resetPassword,
);
authRouter.use(sessionRouter);


authRouter.get('/me', authenticate, authController.me);
