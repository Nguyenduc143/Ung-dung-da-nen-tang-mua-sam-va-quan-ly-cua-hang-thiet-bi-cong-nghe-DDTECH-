import { z } from 'zod';

export const chatIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const sequence = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const chatActionSchema = z.object({}).strict();
export const chatListSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  page: z.coerce.number().int().positive().max(1_000_000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict();
export const chatMessagesSchema = z.object({
  beforeSeq: chatIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
}).strict();
export const chatSendSchema = z.object({
  clientMessageId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  content: z.string().trim().min(1).refine(value => Array.from(value).length <= 4000, 'Tối đa 4000 ký tự'),
}).strict();
export const chatReadSchema = z.object({ readSeq: sequence }).strict();
export type ChatListQuery = z.infer<typeof chatListSchema>;
export type ChatMessagesQuery = z.infer<typeof chatMessagesSchema>;
export type ChatSendInput = z.infer<typeof chatSendSchema>;
