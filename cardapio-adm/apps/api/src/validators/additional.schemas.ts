import { z } from 'zod';
import { SelectionType } from '@prisma/client';

function checkMinMax(
  data: { minQuantity?: number; maxQuantity?: number },
  ctx: z.RefinementCtx,
) {
  if (
    data.minQuantity !== undefined &&
    data.maxQuantity !== undefined &&
    data.minQuantity > data.maxQuantity
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Quantidade mínima não pode ser maior que a máxima.',
      path: ['minQuantity'],
    });
  }
}

const additionalGroupBase = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  selectionType: z.nativeEnum(SelectionType).optional(),
  isRequired: z.boolean().optional(),
  minQuantity: z.number().int().min(0).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const createAdditionalGroupSchema = additionalGroupBase.superRefine(checkMinMax);
export const updateAdditionalGroupSchema = additionalGroupBase.partial().superRefine(checkMinMax);

export const createAdditionalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço não pode ser negativo.').optional().default(0),
  imageUrl: z.string().url('URL da imagem inválida.').optional().or(z.literal('')),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateAdditionalSchema = createAdditionalSchema.partial();

export const linkProductToGroupSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório.'),
  sortOrder: z.number().int().optional(),
});

export type CreateAdditionalGroupInput = z.infer<typeof createAdditionalGroupSchema>;
export type UpdateAdditionalGroupInput = z.infer<typeof updateAdditionalGroupSchema>;
export type CreateAdditionalInput = z.infer<typeof createAdditionalSchema>;
export type UpdateAdditionalInput = z.infer<typeof updateAdditionalSchema>;
export type LinkProductToGroupInput = z.infer<typeof linkProductToGroupSchema>;
