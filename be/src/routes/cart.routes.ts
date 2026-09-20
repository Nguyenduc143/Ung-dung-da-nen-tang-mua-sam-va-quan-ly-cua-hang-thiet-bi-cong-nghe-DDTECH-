import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { cartItemRouter } from './cart-item.routes';
export const cartRouter = Router();
cartRouter.use(authenticate);
cartRouter.get('/', cartController.get);
cartRouter.use(cartItemRouter);


cartRouter.delete('/', cartController.clear);
