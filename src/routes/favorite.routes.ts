import { Router } from 'express';

import * as favoriteController from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validate.middleware';
import { favoriteProductIdParamsSchema } from '../validators/cart.validator';

export const favoriteRouter = Router();

favoriteRouter.use(authenticate);
favoriteRouter.get('/', favoriteController.list);
favoriteRouter.post(
  '/:productId',
  validateParams(favoriteProductIdParamsSchema),
  favoriteController.add,
);
favoriteRouter.delete(
  '/:productId',
  validateParams(favoriteProductIdParamsSchema),
  favoriteController.remove,
);