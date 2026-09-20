import { Router } from 'express';
import * as adminReviewController from '../controllers/admin-review.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
replyReviewSchema,
updateReviewStatusSchema
} from '../validators/review.validator';
export const adminReviewRouter = Router();
adminReviewRouter.use(authenticate, requireAdmin);
adminReviewRouter.get('/', adminReviewController.adminList);
adminReviewRouter.patch(
  '/:id/status',
  validateBody(updateReviewStatusSchema),
  adminReviewController.updateStatus,
);
adminReviewRouter.post(
  '/:id/reply',
  validateBody(replyReviewSchema),
  adminReviewController.reply,
);
