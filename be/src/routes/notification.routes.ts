import { Router } from 'express';

import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { notificationActionSchema } from '../validators/notification.validator';

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get('/', notificationController.list);
notificationRouter.get('/unread-count', notificationController.unreadCount);
notificationRouter.patch(
  '/read-all',
  validateBody(notificationActionSchema),
  notificationController.readAll,
);
notificationRouter.patch(
  '/:id/read',
  validateBody(notificationActionSchema),
  notificationController.read,
);
