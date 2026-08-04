import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória.'),
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser maior que zero.'),
  promoPrice: z.number().positive().optional().nullable(),
  imageUrl: z.string().url('URL da imagem inválida.').optional().or(z.literal('')),
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

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductPriceInput = z.infer<typeof updateProductPriceSchema>;
