import { Router } from 'express';

import type { ApiResponse } from '../types/api-response';
import { addressRouter } from './address.routes';
import { adminUserRouter } from './admin-user.routes';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { catalogRouter } from './catalog.routes';
import { productRouter } from './product.routes';
import { cartRouter } from './cart.routes';
import { favoriteRouter } from './favorite.routes';
import { orderRouter } from './order.routes';
import { adminOrderRouter } from './admin-order.routes';
import { paymentRouter } from './payment.routes';
import { adminPromotionRouter, promotionRouter } from './promotion.routes';
import { reviewRouter } from './review.routes';
import { adminReviewRouter } from './admin-review.routes';
import { notificationRouter } from './notification.routes';
import { inventoryRouter } from './inventory.routes';
import { dashboardRouter } from './dashboard.routes';

interface HealthData {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/admin/users', adminUserRouter);
apiRouter.use(catalogRouter);
apiRouter.use(productRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/favorites', favoriteRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/admin/orders', adminOrderRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/promotions', promotionRouter);
apiRouter.use('/admin/promotions', adminPromotionRouter);
apiRouter.use(reviewRouter);
apiRouter.use('/admin/reviews', adminReviewRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/admin/inventory', inventoryRouter);
apiRouter.use('/admin/dashboard', dashboardRouter);

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
