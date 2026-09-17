import * as handlers from '../utils/catalog-handlers';

export const list = handlers.list('categories', true);
export const adminList = handlers.list('categories', false);
export const detail = handlers.detail('categories');
export const create = handlers.mutate('categories', 'create');
export const update = handlers.mutate('categories', 'update');
export const remove = handlers.mutate('categories', 'delete');
