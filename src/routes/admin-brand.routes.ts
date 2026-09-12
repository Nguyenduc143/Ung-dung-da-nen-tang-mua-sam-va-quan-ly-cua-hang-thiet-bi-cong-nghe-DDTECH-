import { Router } from 'express';

import * as brandController from '../controllers/brand.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  brandIdParamsSchema,
  createBrandSchema,
  updateBrandSchema,
} from '../validators/catalog.validator';

export const adminBrandRouter = Router();

adminBrandRouter.use(authenticate, requireAdmin);
adminBrandRouter.get('/', brandController.listAdmin);
adminBrandRouter.post('/', validateBody(createBrandSchema), brandController.create);
adminBrandRouter.patch(
  '/:id',
  validateParams(brandIdParamsSchema),
  validateBody(updateBrandSchema),
  brandController.update,
);
adminBrandRouter.delete(
  '/:id',
  validateParams(brandIdParamsSchema),
  brandController.remove,
);