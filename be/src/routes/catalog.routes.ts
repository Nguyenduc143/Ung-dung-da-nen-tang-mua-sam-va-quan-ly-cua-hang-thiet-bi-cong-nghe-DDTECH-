import { Router } from 'express';
import { brandRouter } from './brand.routes';
import { categoryAttributeRouter } from './category-attribute.routes';
import { categoryRouter } from './category.routes';
export const catalogRouter = Router();
catalogRouter.use(categoryRouter);
catalogRouter.use(brandRouter);
catalogRouter.use(categoryAttributeRouter);
