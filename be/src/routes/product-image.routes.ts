import { Router } from 'express';
import * as imageController from '../controllers/product-image.controller';
import { validateBody } from '../middleware/validate.middleware';
import {
createProductImageSchema
} from '../validators/product.validator';
export const productImageRouter = Router();
productImageRouter.post(
  '/products/:id/images',
  validateBody(createProductImageSchema),
  imageController.createImage,
);
productImageRouter.delete('/product-images/:id', imageController.removeImage);
productImageRouter.patch('/product-images/:id/primary', imageController.setPrimaryImage);
