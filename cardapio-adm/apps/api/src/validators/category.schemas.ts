import { z } from 'zod';

const imageUrlSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith('data:image/')) return true;
      return z.string().url().safeParse(value).success;
    },
    { message: 'URL da imagem inválida.' },
  );

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int(),
      }),
    )
    .min(1, 'Informe ao menos uma categoria.'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
