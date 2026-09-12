import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { validateParams } from '../middleware/validate.middleware';
import { categorySlugParamsSchema } from '../validators/catalog.validator';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.listPublic);
categoryRouter.get(
  '/:slug',
  validateParams(categorySlugParamsSchema),
  categoryController.getPublicBySlug,
);