import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
createReviewSchema,
updateReviewSchema
} from '../validators/review.validator';
import { adminReviewRouter } from './admin-review.routes';
export const reviewRouter = Router();
reviewRouter.get('/products/:productId/reviews', reviewController.productReviews);
reviewRouter.post(
  '/products/:productId/reviews',
  authenticate,
  validateBody(createReviewSchema),
  reviewController.create,
);
reviewRouter.patch(
  '/reviews/:id',
  authenticate,
  validateBody(updateReviewSchema),
  reviewController.update,
);
reviewRouter.delete('/reviews/:id', authenticate, reviewController.remove);





export { adminReviewRouter };
