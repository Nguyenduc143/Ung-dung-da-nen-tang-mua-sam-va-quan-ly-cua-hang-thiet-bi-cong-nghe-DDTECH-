import { Router } from 'express';
import * as adminOrderController from '../controllers/admin-order.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
updateOrderStatusSchema
} from '../validators/order.validator';
export const adminOrderRouter = Router();
adminOrderRouter.use(authenticate, requireAdmin);
adminOrderRouter.get('/', adminOrderController.adminList);
adminOrderRouter.get('/:id', adminOrderController.adminDetail);
adminOrderRouter.patch(
  '/:id/status',
  validateBody(updateOrderStatusSchema),
  adminOrderController.updateStatus,
);
