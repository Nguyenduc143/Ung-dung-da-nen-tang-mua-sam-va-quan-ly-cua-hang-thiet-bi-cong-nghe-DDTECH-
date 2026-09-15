import { z } from 'zod';

export const paymentOrderIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const createPaymentSchema = z.object({}).strict();
