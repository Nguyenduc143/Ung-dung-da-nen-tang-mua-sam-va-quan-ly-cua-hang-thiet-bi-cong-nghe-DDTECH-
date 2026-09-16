import { withTransaction } from '../config/database';
import * as repo from '../repositories/catalog.repository';
import type { CatalogKind } from '../repositories/catalog.repository';
import { AppError } from '../utils/app-error';

export function makeSlug(name: string): string {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new AppError(422, 'Tên không tạo được slug; hãy cung cấp slug');
  return slug;
}
export async function list(kind: CatalogKind, publicOnly: boolean, categoryId?: number) {
  if (categoryId !== undefined && !await repo.find('categories', categoryId)) throw new AppError(404, 'Không tìm thấy danh mục');
  return repo.list(kind, publicOnly, categoryId);
}
export async function detail(kind: CatalogKind, slug: string) {
  const row = await repo.find(kind, slug, true);
  if (!row) throw new AppError(404, 'Không tìm thấy bản ghi');
  return kind === 'categories' ? { ...row, attributes: await repo.list('category_attributes', false, row.id) } : row;
}
export async function mutate(kind: CatalogKind, input: Record<string, unknown>, id?: number, deleting = false) {
  try {
    return await withTransaction(async db => {
      const tree = kind !== 'brands' ? await repo.lockTree(db) : [];
      if (id !== undefined) await repo.lockRecord(kind, id, db);
      const existing = id === undefined ? null : await repo.find(kind, id, false, db);
      if (id !== undefined && !existing) throw new AppError(404, 'Không tìm thấy bản ghi');
      const data = { ...input };
      if (kind === 'categories' && !deleting) {
        let parent = (data.parentId === undefined ? existing?.parentId : data.parentId) as number | null | undefined;
        const visited = new Set<number>(id === undefined ? [] : [id]);
        while (parent != null) {
          if (visited.has(parent)) throw new AppError(409, 'Danh mục cha tạo vòng lặp');
          visited.add(parent);
          const node = tree.find(row => row.id === parent);
          if (!node || node.deletedAt) throw new AppError(404, 'Danh mục cha không tồn tại');
          parent = node.parentId;
        }
      }
      if (kind === 'category_attributes') {
        const merged: Record<string, unknown> = { inputType: 'TEXT', ...existing, ...data };
        const parent = tree.find(row => row.id === merged.categoryId && !row.deletedAt);
        if (!parent) throw new AppError(404, 'Không tìm thấy danh mục');
        if (!deleting && merged.inputType === 'SELECT' && (!Array.isArray(merged.options) || !merged.options.length))
          throw new AppError(422, 'Thuộc tính SELECT phải có options');
        if (!deleting && merged.inputType !== 'SELECT') data.options = null;
      }
      if (deleting) { await repo.remove(kind, id!, db); return null; }
      if (kind !== 'category_attributes' && id === undefined && data.slug === undefined) data.slug = makeSlug(String(data.name));
      const savedId = await repo.save(kind, data, id, db);
      return repo.find(kind, savedId, false, db);
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY')
      throw new AppError(409, 'Slug hoặc mã thuộc tính đã tồn tại');
    throw error;
  }
}
