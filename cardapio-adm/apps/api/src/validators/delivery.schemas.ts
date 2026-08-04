import { z } from 'zod';
import { DeliveryZoneType, OrderStatus } from '@prisma/client';

function checkZoneTypeFields(
  data: { zoneType?: DeliveryZoneType; zipPrefix?: string; radiusKm?: number },
  ctx: z.RefinementCtx,
) {
  if (data.zoneType === DeliveryZoneType.ZIP && !data.zipPrefix) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o prefixo de CEP para zonas do tipo CEP.',
      path: ['zipPrefix'],
    });
  }
  if (data.zoneType === DeliveryZoneType.RADIUS && data.radiusKm === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o raio em km para zonas do tipo raio.',
      path: ['radiusKm'],
    });
  }
}

const deliveryZoneBase = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  zoneType: z.nativeEnum(DeliveryZoneType).optional(),
  fee: z.number().min(0, 'Taxa não pode ser negativa.'),
  minOrderValue: z.number().min(0).optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  zipPrefix: z.string().optional(),
  radiusKm: z.number().positive().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const createDeliveryZoneSchema = deliveryZoneBase.superRefine(checkZoneTypeFields);
export const updateDeliveryZoneSchema = deliveryZoneBase
  .partial()
  .superRefine(checkZoneTypeFields);

export const listDeliveriesQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  unassignedOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

export const assignCourierSchema = z.object({
  courierId: z.string().min(1, 'Selecione um entregador.').nullable(),
});

export const updateDeliveryTimesSchema = z
  .object({
    deliveryLeftAt: z.string().datetime().optional().nullable(),
    deliveryCompletedAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => data.deliveryLeftAt !== undefined || data.deliveryCompletedAt !== undefined,
    { message: 'Informe ao menos um horário para atualizar.' },
  );

export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>;
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>;
export type ListDeliveriesQuery = z.infer<typeof listDeliveriesQuerySchema>;
export type AssignCourierInput = z.infer<typeof assignCourierSchema>;
export type UpdateDeliveryTimesInput = z.infer<typeof updateDeliveryTimesSchema>;
