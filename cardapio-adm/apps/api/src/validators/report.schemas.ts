import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['today', '7d', '30d', 'custom']).optional().default('30d'),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
