import { Router } from 'express';
import * as variantController from '../controllers/product-variant.controller';
import { validateBody } from '../middleware/validate.middleware';
import {
createVariantSchema,
updateVariantSchema
} from '../validators/product.validator';
export const productVariantRouter = Router();
productVariantRouter.post(
  '/products/:id/variants',
  validateBody(createVariantSchema),
  variantController.createVariant,
);
productVariantRouter.patch(
  '/variants/:id',
  validateBody(updateVariantSchema),
  variantController.updateVariant,
);
productVariantRouter.delete('/variants/:id', variantController.removeVariant);
