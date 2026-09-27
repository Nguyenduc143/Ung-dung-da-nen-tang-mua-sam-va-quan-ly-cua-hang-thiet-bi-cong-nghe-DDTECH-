import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const name = z.string().trim().min(1).max(100);
const url = z.string().url().max(500).nullable();
const status = z.enum(['ACTIVE', 'HIDDEN']);
const sortOrder = z.number().int().min(-2147483648).max(2147483647);
export const categorySchema = z.object({
  name, slug: slugSchema.optional(), parentId: idSchema.nullable().optional(),
  description: z.string().max(500).nullable().optional(), imageUrl: url.optional(),
  sortOrder: sortOrder.optional(), status: status.optional(),
}).strict();
export const brandSchema = z.object({
  name, slug: slugSchema.optional(), logoUrl: url.optional(),
  description: z.string().max(500).nullable().optional(), status: status.optional(),
}).strict();
export const attributeSchema = z.object({
  attrKey: z.string().regex(/^[a-z][a-z0-9_]*$/).max(50),
  attrName: name, unit: z.string().max(20).nullable().optional(),
  inputType: z.enum(['TEXT', 'NUMBER', 'SELECT']).optional(),
  options: z.array(z.string().min(1).max(255)).min(1).max(100).nullable().optional(),
  isFilterable: z.boolean().optional(), sortOrder: sortOrder.optional(),
}).strict();
const nonempty = (data: object) => Object.keys(data).length > 0;
export const categoryPatch = categorySchema.partial().refine(nonempty, 'Cần ít nhất một trường');

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const emptyToNull = (value: unknown) => value === '' || value === 'null' ? null : value;
const categoryUploadFields = {
  name,
  slug: z.preprocess(emptyToUndefined, slugSchema.optional()),
  parentId: z.preprocess(emptyToNull, idSchema.nullable().optional()),
  description: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  sortOrder: z.preprocess(emptyToUndefined, z.coerce.number().int().min(-2147483648).max(2147483647).optional()),
  status: status.optional(),
};
export const categoryUploadSchema = z.object(categoryUploadFields).strict();
export const categoryUploadPatch = z.object({
  name: name.optional(),
  slug: categoryUploadFields.slug,
  parentId: categoryUploadFields.parentId,
  description: categoryUploadFields.description,
  sortOrder: categoryUploadFields.sortOrder,
  status: categoryUploadFields.status,
}).strict().refine(nonempty, 'Cần ít nhất một trường');
const brandUploadFields = {
  name,
  slug: z.preprocess(emptyToUndefined, slugSchema.optional()),
  description: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  status: status.optional(),
};
export const brandUploadSchema = z.object(brandUploadFields).strict();
export const brandUploadPatch = z.object({
  name: name.optional(),
  slug: brandUploadFields.slug,
  description: brandUploadFields.description,
  status: brandUploadFields.status,
}).strict().refine(nonempty, 'Cần ít nhất một trường');
export const brandPatch = brandSchema.partial().refine(nonempty, 'Cần ít nhất một trường');
export const attributePatch = attributeSchema.partial().refine(nonempty, 'Cần ít nhất một trường');
