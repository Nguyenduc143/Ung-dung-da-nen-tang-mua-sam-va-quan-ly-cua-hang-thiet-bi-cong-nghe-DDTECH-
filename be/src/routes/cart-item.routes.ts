import { Router } from 'express';
import * as cartItemController from '../controllers/cart-item.controller';
import { validateBody } from '../middleware/validate.middleware';
import { addCartItemSchema,updateCartItemSchema } from '../validators/cart.validator';
export const cartItemRouter = Router();
cartItemRouter.post('/items', validateBody(addCartItemSchema), cartItemController.addItem);
cartItemRouter.patch('/items/:id', validateBody(updateCartItemSchema), cartItemController.updateItem);
cartItemRouter.delete('/items/:id', cartItemController.removeItem);
