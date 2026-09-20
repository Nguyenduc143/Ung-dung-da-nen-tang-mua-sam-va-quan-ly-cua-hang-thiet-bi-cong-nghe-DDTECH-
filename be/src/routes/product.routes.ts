import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
createProductSchema,
updateProductSchema
} from '../validators/product.validator';
import { productImageRouter } from './product-image.routes';
import { productVariantRouter } from './product-variant.routes';
export const productRouter = Router();
productRouter.get('/products', productController.list);
productRouter.get('/products/slug/:slug', productController.detailBySlug);
productRouter.get('/products/:id', productController.detailById);
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);
adminRouter.get('/products', productController.adminList);
adminRouter.get('/products/:id', productController.adminDetailById);
adminRouter.post('/products', validateBody(createProductSchema), productController.create);
adminRouter.patch('/products/:id', validateBody(updateProductSchema), productController.update);
adminRouter.delete('/products/:id', productController.remove);
adminRouter.use(productVariantRouter);
adminRouter.use(productImageRouter);


productRouter.use('/admin', adminRouter);
