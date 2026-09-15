import { Router } from 'express';

import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { addCartItemSchema, updateCartItemSchema } from '../validators/cart.validator';

export const cartRouter = Router();

cartRouter.use(authenticate);
cartRouter.get('/', cartController.get);
cartRouter.post('/items', validateBody(addCartItemSchema), cartController.addItem);
cartRouter.patch('/items/:id', validateBody(updateCartItemSchema), cartController.updateItem);
cartRouter.delete('/items/:id', cartController.removeItem);
cartRouter.delete('/', cartController.clear);
