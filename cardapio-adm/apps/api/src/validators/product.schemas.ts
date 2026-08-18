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

export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória.'),
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser maior que zero.'),
  promoPrice: z.number().positive().optional().nullable(),
  imageUrl: imageUrlSchema,
  internalCode: z.string().optional(),
  prepTimeMinutes: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).optional().nullable(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateProductPriceSchema = z.object({
  price: z.number().positive('Preço deve ser maior que zero.'),
  promoPrice: z.number().positive().optional().nullable(),
});

export const reorderProductsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int(),
      }),
    )
    .min(1),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductPriceInput = z.infer<typeof updateProductPriceSchema>;
export type ReorderProductsInput = z.infer<typeof reorderProductsSchema>;
