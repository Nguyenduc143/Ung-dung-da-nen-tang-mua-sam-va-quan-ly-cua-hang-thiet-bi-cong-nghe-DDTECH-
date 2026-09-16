import { Router } from 'express';

import * as favoriteController from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';

export const favoriteRouter = Router();

favoriteRouter.use(authenticate);
favoriteRouter.get('/', favoriteController.list);
favoriteRouter.post('/:productId', favoriteController.add);
favoriteRouter.delete('/:productId', favoriteController.remove);
