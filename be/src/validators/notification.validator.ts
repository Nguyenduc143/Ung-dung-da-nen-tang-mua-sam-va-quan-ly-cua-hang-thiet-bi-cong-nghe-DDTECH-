import { z } from 'zod';

export const notificationIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const notificationActionSchema = z.object({}).strict();

const queryBoolean = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

export const notificationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    unreadOnly: queryBoolean.optional(),
    type: z.enum(['ORDER', 'PAYMENT', 'PROMOTION', 'REVIEW', 'SYSTEM']).optional(),
  })
  .strict();

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
