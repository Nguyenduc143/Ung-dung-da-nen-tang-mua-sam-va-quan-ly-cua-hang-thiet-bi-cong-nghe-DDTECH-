import { Router } from 'express';

import * as promotionController from '../controllers/promotion.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  createPromotionSchema,
  updatePromotionSchema,
  validatePromotionSchema,
} from '../validators/promotion.validator';

export const promotionRouter = Router();

promotionRouter.use(authenticate);
promotionRouter.post(
  '/validate',
  validateBody(validatePromotionSchema),
  promotionController.validate,
);

export const adminPromotionRouter = Router();

adminPromotionRouter.use(authenticate, requireAdmin);
adminPromotionRouter.get('/', promotionController.list);
adminPromotionRouter.post(
  '/',
  validateBody(createPromotionSchema),
  promotionController.create,
);
adminPromotionRouter.patch(
  '/:id',
  validateBody(updatePromotionSchema),
  promotionController.update,
);
adminPromotionRouter.delete('/:id', promotionController.remove);
