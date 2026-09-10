import { Router } from 'express';

import type { ApiResponse } from '../types/api-response';
import { addressRouter } from './address.routes';
import { adminUserRouter } from './admin-user.routes';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';

interface HealthData {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/admin/users', adminUserRouter);

apiRouter.get('/health', (_req, res) => {
  const response: ApiResponse<HealthData> = {
    success: true,
    message: 'DDTECH API đang hoạt động',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };

  res.status(200).json(response);
});
