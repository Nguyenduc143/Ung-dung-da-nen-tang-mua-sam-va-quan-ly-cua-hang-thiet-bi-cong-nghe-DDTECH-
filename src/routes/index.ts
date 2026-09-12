import { Router } from 'express';

import type { ApiResponse } from '../types/api-response';
import { addressRouter } from './address.routes';
import { cartRouter } from './cart.routes';
import { favoriteRouter } from './favorite.routes';
import { adminBrandRouter } from './admin-brand.routes';
import { adminCategoryAttributeRouter } from './admin-category-attribute.routes';
import { adminCategoryRouter } from './admin-category.routes';
import { adminUserRouter } from './admin-user.routes';
import { authRouter } from './auth.routes';
import { brandRouter } from './brand.routes';
import { categoryRouter } from './category.routes';
import { adminImageRouter, adminProductRouter, adminVariantRouter } from './admin-product.routes';
import { productRouter } from './product.routes';
import { userRouter } from './user.routes';

interface HealthData {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/favorites', favoriteRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/brands', brandRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/admin/categories', adminCategoryRouter);
apiRouter.use('/admin/category-attributes', adminCategoryAttributeRouter);
apiRouter.use('/admin/brands', adminBrandRouter);
apiRouter.use('/admin/products', adminProductRouter);
apiRouter.use('/admin/variants', adminVariantRouter);
apiRouter.use('/admin/product-images', adminImageRouter);
apiRouter.use('/admin/users', adminUserRouter);

apiRouter.get('/health', (_req, res) => {
  const response: ApiResponse<HealthData> = {
    success: true,
    message: 'DDTECH API đang hoạt động',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };

  res.status(200).json(response);
});
