import { z } from 'zod';
import { CouponType } from '@prisma/client';

function checkPercentageRange(
  data: { type?: CouponType; value?: number },
  ctx: z.RefinementCtx,
) {
  if (data.type === CouponType.PERCENTAGE && data.value !== undefined) {
    if (data.value <= 0 || data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cupons de porcentagem devem ter valor entre 1 e 100.',
        path: ['value'],
      });
    }
  }
}

const couponBase = z.object({
  code: z
    .string()
    .min(2, 'Código deve ter pelo menos 2 caracteres.')
    .max(40, 'Código muito longo.')
    .transform((value) => value.trim().toUpperCase()),
  description: z.string().optional(),
  type: z.nativeEnum(CouponType, { errorMap: () => ({ message: 'Tipo de cupom inválido.' }) }),
  value: z.number().min(0, 'Valor não pode ser negativo.'),
  minOrderValue: z.number().min(0).optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perCustomerLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createCouponSchema = couponBase.superRefine(checkPercentageRange);
export const updateCouponSchema = couponBase.partial().superRefine(checkPercentageRange);

export const listCouponsQuerySchema = z.object({
  includeArchived: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
  search: z.string().optional(),
});

export const archiveCouponSchema = z.object({
  isArchived: z.boolean(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ListCouponsQuery = z.infer<typeof listCouponsQuerySchema>;
export type ArchiveCouponInput = z.infer<typeof archiveCouponSchema>;
