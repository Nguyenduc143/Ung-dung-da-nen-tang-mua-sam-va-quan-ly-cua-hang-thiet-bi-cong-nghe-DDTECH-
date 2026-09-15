import { Router } from 'express';

import * as reviewController from '../controllers/review.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  createReviewSchema,
  replyReviewSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
} from '../validators/review.validator';

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

export const adminReviewRouter = Router();

adminReviewRouter.use(authenticate, requireAdmin);
adminReviewRouter.get('/', reviewController.adminList);
adminReviewRouter.patch(
  '/:id/status',
  validateBody(updateReviewStatusSchema),
  reviewController.updateStatus,
);
adminReviewRouter.post(
  '/:id/reply',
  validateBody(replyReviewSchema),
  reviewController.reply,
);
