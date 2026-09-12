import { Router } from 'express';

import * as productController from '../controllers/product.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  createImageSchema,
  createProductSchema,
  createVariantSchema,
  imageIdParamsSchema,
  productIdParamsSchema,
  updateProductSchema,
  updateVariantSchema,
  variantIdParamsSchema,
} from '../validators/product.validator';

export const adminProductRouter = Router();

adminProductRouter.use(authenticate, requireAdmin);
adminProductRouter.post('/', validateBody(createProductSchema), productController.create);
adminProductRouter.patch(
  '/:id',
  validateParams(productIdParamsSchema),
  validateBody(updateProductSchema),
  productController.update,
);
adminProductRouter.delete(
  '/:id',
  validateParams(productIdParamsSchema),
  productController.remove,
);
adminProductRouter.post(
  '/:id/variants',
  validateParams(productIdParamsSchema),
  validateBody(createVariantSchema),
  productController.createVariant,
);
adminProductRouter.post(
  '/:id/images',
  validateParams(productIdParamsSchema),
  validateBody(createImageSchema),
  productController.createImage,
);

export const adminVariantRouter = Router();
adminVariantRouter.use(authenticate, requireAdmin);
adminVariantRouter.patch(
  '/:id',
  validateParams(variantIdParamsSchema),
  validateBody(updateVariantSchema),
  productController.updateVariant,
);
adminVariantRouter.delete(
  '/:id',
  validateParams(variantIdParamsSchema),
  productController.removeVariant,
);

export const adminImageRouter = Router();
adminImageRouter.use(authenticate, requireAdmin);
adminImageRouter.delete(
  '/:id',
  validateParams(imageIdParamsSchema),
  productController.removeImage,
);
adminImageRouter.patch(
  '/:id/primary',
  validateParams(imageIdParamsSchema),
  productController.setPrimaryImage,
);