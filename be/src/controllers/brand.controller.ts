import * as handlers from '../utils/catalog-handlers';

export const list = handlers.list('brands', true);
export const adminList = handlers.list('brands', false);
export const detail = handlers.detail('brands');
export const create = handlers.mutate('brands', 'create');
export const update = handlers.mutate('brands', 'update');
export const remove = handlers.mutate('brands', 'delete');
