import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  categoryAttributeIdParamsSchema,
  updateCategoryAttributeSchema,
} from '../validators/catalog.validator';

export const adminCategoryAttributeRouter = Router();

adminCategoryAttributeRouter.use(authenticate, requireAdmin);
adminCategoryAttributeRouter.patch(
  '/:id',
  validateParams(categoryAttributeIdParamsSchema),
  validateBody(updateCategoryAttributeSchema),
  categoryController.updateAttribute,
);
adminCategoryAttributeRouter.delete(
  '/:id',
  validateParams(categoryAttributeIdParamsSchema),
  categoryController.removeAttribute,
);