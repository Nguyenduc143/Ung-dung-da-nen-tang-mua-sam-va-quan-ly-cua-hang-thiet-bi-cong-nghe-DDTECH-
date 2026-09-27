import { Router } from 'express';

import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { receiveAvatarImage } from '../middleware/upload.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { changePasswordSchema, updateProfileSchema } from '../validators/user.validator';

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.get('/me', userController.getMe);
userRouter.patch('/me', validateBody(updateProfileSchema), userController.updateMe);
userRouter.post('/me/avatar', receiveAvatarImage, userController.uploadAvatar);
userRouter.patch('/me/password', validateBody(changePasswordSchema), userController.changePassword);
