import { Router } from 'express';

import * as reportController from '../controllers/report.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';

export const reportRouter = Router();

reportRouter.use(authenticate, requireAdmin);

reportRouter.get('/revenue', reportController.revenue);
reportRouter.get('/orders', reportController.orders);
reportRouter.get('/products', reportController.products);
reportRouter.get('/inventory', reportController.inventory);
reportRouter.get('/export', reportController.exportFile);
