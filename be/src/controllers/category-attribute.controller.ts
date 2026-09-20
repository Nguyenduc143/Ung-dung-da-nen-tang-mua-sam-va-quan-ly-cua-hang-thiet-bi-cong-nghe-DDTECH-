import * as handlers from '../utils/catalog-handlers';

export const list = handlers.list('category_attributes', false);
export const create = handlers.mutate('category_attributes', 'create');
export const update = handlers.mutate('category_attributes', 'update');
export const remove = handlers.mutate('category_attributes', 'delete');
