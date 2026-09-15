import { Router } from 'express';

import * as orderController from '../controllers/order.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  cancelOrderSchema,
  checkoutSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator';

export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post('/', validateBody(checkoutSchema), orderController.checkout);
orderRouter.get('/my-orders', orderController.myOrders);
orderRouter.get('/:id', orderController.customerDetail);
orderRouter.patch('/:id/cancel', validateBody(cancelOrderSchema), orderController.cancel);

export const adminOrderRouter = Router();

adminOrderRouter.use(authenticate, requireAdmin);
adminOrderRouter.get('/', orderController.adminList);
adminOrderRouter.get('/:id', orderController.adminDetail);
adminOrderRouter.patch(
  '/:id/status',
  validateBody(updateOrderStatusSchema),
  orderController.updateStatus,
);
