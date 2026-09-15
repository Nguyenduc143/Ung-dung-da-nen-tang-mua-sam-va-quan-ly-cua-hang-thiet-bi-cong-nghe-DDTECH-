import { Router } from 'express';

import * as productController from '../controllers/product.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  createProductImageSchema,
  createProductSchema,
  createVariantSchema,
  updateProductSchema,
  updateVariantSchema,
} from '../validators/product.validator';

export const productRouter = Router();

productRouter.get('/products', productController.list);
productRouter.get('/products/slug/:slug', productController.detailBySlug);
productRouter.get('/products/:id', productController.detailById);

const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.post('/products', validateBody(createProductSchema), productController.create);
adminRouter.patch('/products/:id', validateBody(updateProductSchema), productController.update);
adminRouter.delete('/products/:id', productController.remove);
adminRouter.post(
  '/products/:id/variants',
  validateBody(createVariantSchema),
  productController.createVariant,
);
adminRouter.patch(
  '/variants/:id',
  validateBody(updateVariantSchema),
  productController.updateVariant,
);
adminRouter.delete('/variants/:id', productController.removeVariant);
adminRouter.post(
  '/products/:id/images',
  validateBody(createProductImageSchema),
  productController.createImage,
);
adminRouter.delete('/product-images/:id', productController.removeImage);
adminRouter.patch('/product-images/:id/primary', productController.setPrimaryImage);

productRouter.use('/admin', adminRouter);
