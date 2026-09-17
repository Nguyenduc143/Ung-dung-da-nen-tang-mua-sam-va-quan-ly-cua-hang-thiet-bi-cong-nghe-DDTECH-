import { Router } from 'express';
import { validateParams } from '../middleware/validate.middleware';

import * as userController from '../controllers/admin-user.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateUserStatusSchema,userIdParamsSchema } from '../validators/user.validator';

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
