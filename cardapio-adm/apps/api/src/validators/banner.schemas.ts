import { z } from 'zod';

const bannerBase = z.object({
  title: z.string().min(1, 'Título é obrigatório.'),
  subtitle: z.string().optional(),
  imageUrl: z.string().url('URL da imagem inválida.'),
  buttonLabel: z.string().optional(),
  linkUrl: z.string().optional(),
  productId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().optional(),
  showDesktop: z.boolean().optional(),
  showMobile: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createBannerSchema = bannerBase;
export const updateBannerSchema = bannerBase.partial();

export const listBannersQuerySchema = z.object({
  includeInactive: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type ListBannersQuery = z.infer<typeof listBannersQuerySchema>;
