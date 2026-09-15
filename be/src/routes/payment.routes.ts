import { Router } from 'express';

import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createPaymentSchema } from '../validators/payment.validator';

export const paymentRouter = Router();

paymentRouter.use(authenticate);
paymentRouter.post(
  '/:orderId/create',
  validateBody(createPaymentSchema),
  paymentController.create,
);
paymentRouter.get('/:orderId', paymentController.detail);
