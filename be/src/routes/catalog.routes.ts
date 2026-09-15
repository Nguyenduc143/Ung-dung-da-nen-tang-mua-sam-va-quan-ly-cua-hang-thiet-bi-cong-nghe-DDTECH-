import { Router } from 'express';
import * as controller from '../controllers/catalog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateBody } from '../middleware/validate.middleware';
import * as schema from '../validators/catalog.validator';

export const catalogRouter = Router();
for (const kind of ['categories', 'brands'] as const) {
  catalogRouter.get(`/${kind}`, controller.list(kind, true));
  catalogRouter.get(`/${kind}/:slug`, controller.detail(kind));
}
const admin = Router();
admin.use(authenticate, requireAdmin);
for (const kind of ['categories', 'brands'] as const) {
  admin.get(`/${kind}`, controller.list(kind, false));
  admin.post(`/${kind}`, validateBody(kind === 'categories' ? schema.categorySchema : schema.brandSchema), controller.mutate(kind, 'create'));
  admin.patch(`/${kind}/:id`, validateBody(kind === 'categories' ? schema.categoryPatch : schema.brandPatch), controller.mutate(kind, 'update'));
  admin.delete(`/${kind}/:id`, controller.mutate(kind, 'delete'));
}
admin.get('/categories/:id/attributes', controller.list('category_attributes', false));
admin.post('/categories/:id/attributes', validateBody(schema.attributeSchema), controller.mutate('category_attributes', 'create'));
admin.patch('/category-attributes/:id', validateBody(schema.attributePatch), controller.mutate('category_attributes', 'update'));
admin.delete('/category-attributes/:id', controller.mutate('category_attributes', 'delete'));
catalogRouter.use('/admin', admin);
