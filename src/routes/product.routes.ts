import { Router } from 'express';

import * as productController from '../controllers/product.controller';
import { validateParams } from '../middleware/validate.middleware';
import {
  productIdParamsSchema,
  productSlugParamsSchema,
} from '../validators/product.validator';

export const productRouter = Router();

productRouter.get('/', productController.listPublic);
productRouter.get(
  '/slug/:slug',
  validateParams(productSlugParamsSchema),
  productController.getPublicBySlug,
);
productRouter.get(
  '/:id',
  validateParams(productIdParamsSchema),
  productController.getPublicById,
);