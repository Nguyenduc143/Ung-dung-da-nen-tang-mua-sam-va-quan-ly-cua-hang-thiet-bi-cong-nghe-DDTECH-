import { Router } from 'express';

import * as brandController from '../controllers/brand.controller';
import { validateParams } from '../middleware/validate.middleware';
import { brandSlugParamsSchema } from '../validators/catalog.validator';

export const brandRouter = Router();

brandRouter.get('/', brandController.listPublic);
brandRouter.get('/:slug', validateParams(brandSlugParamsSchema), brandController.getPublicBySlug);