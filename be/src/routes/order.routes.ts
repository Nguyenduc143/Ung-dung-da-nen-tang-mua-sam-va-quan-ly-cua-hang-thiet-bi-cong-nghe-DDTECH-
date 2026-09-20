import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
cancelOrderSchema,
checkoutSchema
} from '../validators/order.validator';
import { adminOrderRouter } from './admin-order.routes';
export const orderRouter = Router();
orderRouter.use(authenticate);
orderRouter.post('/', validateBody(checkoutSchema), orderController.checkout);
orderRouter.get('/my-orders', orderController.myOrders);
orderRouter.get('/:id', orderController.customerDetail);
orderRouter.patch('/:id/cancel', validateBody(cancelOrderSchema), orderController.cancel);





export { adminOrderRouter };
