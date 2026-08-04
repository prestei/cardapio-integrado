import { z } from 'zod';
import { PromotionStatus, PromotionType } from '@prisma/client';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const promotionBase = z.object({
  name: z.string().min(2, 'Nome é obrigatório.'),
  description: z.string().optional(),
  type: z.nativeEnum(PromotionType, { errorMap: () => ({ message: 'Tipo de promoção inválido.' }) }),
  value: z.number().min(0).optional().default(0),
  buyQuantity: z.number().int().positive().optional().nullable(),
  getQuantity: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url('URL da imagem inválida.').optional().or(z.literal('')),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  startTime: z.string().regex(timeRegex, 'Horário inválido.').optional().nullable(),
  endTime: z.string().regex(timeRegex, 'Horário inválido.').optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  priority: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
  status: z.nativeEnum(PromotionStatus).optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().min(1)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
});

export const createPromotionSchema = promotionBase;
export const updatePromotionSchema = promotionBase.partial();

export const listPromotionsQuerySchema = z.object({
  status: z.nativeEnum(PromotionStatus).optional(),
  search: z.string().optional(),
  includeInactive: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type ListPromotionsQuery = z.infer<typeof listPromotionsQuerySchema>;
