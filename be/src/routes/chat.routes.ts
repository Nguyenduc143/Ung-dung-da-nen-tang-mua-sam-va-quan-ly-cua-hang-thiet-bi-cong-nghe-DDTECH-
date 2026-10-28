import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { createRateLimit } from '../middleware/rateLimit.middleware';
import * as controller from '../controllers/chat.controller';

const sendLimit = createRateLimit({ windowMs: 60_000, max: 60, message: 'Bạn gửi tin quá nhanh, vui lòng thử lại sau' });
export const chatRouter = Router();
chatRouter.use(authenticate);
chatRouter.post('/conversations', controller.open);
chatRouter.get('/conversations', controller.list);
chatRouter.get('/conversations/:id', controller.detail);
chatRouter.get('/conversations/:id/messages', controller.messages);
chatRouter.post('/conversations/:id/messages', sendLimit, controller.send);
chatRouter.patch('/conversations/:id/read', controller.read);
chatRouter.post('/conversations/:id/close', controller.close);

export const adminChatRouter = Router();
adminChatRouter.use(authenticate, requireAdmin);
adminChatRouter.get('/conversations', controller.list);
adminChatRouter.get('/conversations/:id', controller.detail);
adminChatRouter.get('/conversations/:id/messages', controller.messages);
adminChatRouter.post('/conversations/:id/messages', sendLimit, controller.send);
adminChatRouter.post('/conversations/:id/claim', controller.claim);
adminChatRouter.patch('/conversations/:id/read', controller.read);
adminChatRouter.post('/conversations/:id/close', controller.close);
