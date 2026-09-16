import { Router } from 'express';

import * as inventoryController from '../controllers/inventory.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  adjustInventorySchema,
  importInventorySchema,
} from '../validators/inventory.validator';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate, requireAdmin);
inventoryRouter.get('/', inventoryController.list);
inventoryRouter.get('/transactions', inventoryController.transactions);
inventoryRouter.get('/low-stock', inventoryController.lowStock);
inventoryRouter.post(
  '/adjust',
  validateBody(adjustInventorySchema),
  inventoryController.adjust,
);
inventoryRouter.post(
  '/import',
  validateBody(importInventorySchema),
  inventoryController.importStock,
);
