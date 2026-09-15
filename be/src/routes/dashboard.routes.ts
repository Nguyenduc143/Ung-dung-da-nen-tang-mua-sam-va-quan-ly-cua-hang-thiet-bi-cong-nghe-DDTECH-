import { Router } from 'express';

import * as dashboardController from '../controllers/dashboard.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, requireAdmin);

dashboardRouter.get('/summary', dashboardController.summary);
dashboardRouter.get('/revenue', dashboardController.revenue);
dashboardRouter.get('/orders-by-status', dashboardController.ordersByStatus);
dashboardRouter.get('/top-products', dashboardController.topProducts);
dashboardRouter.get('/recent-orders', dashboardController.recentOrders);
dashboardRouter.get('/low-stock', dashboardController.lowStock);
