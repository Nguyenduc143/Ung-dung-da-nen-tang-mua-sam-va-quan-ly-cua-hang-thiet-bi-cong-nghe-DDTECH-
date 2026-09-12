import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  categoryIdParamsSchema,
  createCategoryAttributeSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/catalog.validator';

export const adminCategoryRouter = Router();

adminCategoryRouter.use(authenticate, requireAdmin);
adminCategoryRouter.get('/', categoryController.listAdmin);
adminCategoryRouter.post('/', validateBody(createCategorySchema), categoryController.create);
adminCategoryRouter.patch(
  '/:id',
  validateParams(categoryIdParamsSchema),
  validateBody(updateCategorySchema),
  categoryController.update,
);
adminCategoryRouter.delete(
  '/:id',
  validateParams(categoryIdParamsSchema),
  categoryController.remove,
);
adminCategoryRouter.get(
  '/:id/attributes',
  validateParams(categoryIdParamsSchema),
  categoryController.listAttributes,
);
adminCategoryRouter.post(
  '/:id/attributes',
  validateParams(categoryIdParamsSchema),
  validateBody(createCategoryAttributeSchema),
  categoryController.createAttribute,
);