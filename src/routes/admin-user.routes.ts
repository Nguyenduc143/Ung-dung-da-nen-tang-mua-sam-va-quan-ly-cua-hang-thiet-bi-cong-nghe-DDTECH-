import { Router } from 'express';

import * as userController from '../controllers/user.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { updateUserStatusSchema, userIdParamsSchema } from '../validators/user.validator';

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, requireAdmin);
adminUserRouter.get('/', userController.listUsers);
adminUserRouter.get('/:id', validateParams(userIdParamsSchema), userController.getUser);
adminUserRouter.patch(
  '/:id/status',
  validateParams(userIdParamsSchema),
  validateBody(updateUserStatusSchema),
  userController.updateStatus,
);
