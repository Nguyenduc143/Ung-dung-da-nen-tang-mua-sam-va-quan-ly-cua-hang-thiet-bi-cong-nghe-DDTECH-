import { Router } from 'express';

import * as addressController from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  addressIdParamsSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../validators/address.validator';

export const addressRouter = Router();

addressRouter.use(authenticate);
addressRouter.get('/', addressController.list);
addressRouter.post('/', validateBody(createAddressSchema), addressController.create);
addressRouter.patch(
  '/:id',
  validateParams(addressIdParamsSchema),
  validateBody(updateAddressSchema),
  addressController.update,
);
addressRouter.delete('/:id', validateParams(addressIdParamsSchema), addressController.remove);
addressRouter.patch(
  '/:id/default',
  validateParams(addressIdParamsSchema),
  addressController.setDefault,
);
