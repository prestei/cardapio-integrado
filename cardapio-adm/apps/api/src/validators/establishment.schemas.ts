import { z } from 'zod';

export const updateEstablishmentSchema = z.object({
  name: z.string().min(2).optional(),
  displayName: z.string().optional(),
  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres.')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens.')
    .optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  cnpj: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  isOpen: z.boolean().optional(),
  closedReason: z.string().optional().nullable(),
});

export const updateSettingsSchema = z.object({
  deliveryFeeType: z.enum(['FIXED', 'ZONE']).optional(),
  fixedDeliveryFee: z.number().min(0).optional().nullable(),
  minOrderValue: z.number().min(0).optional().nullable(),
  minOrderDelivery: z.number().min(0).optional().nullable(),
  minOrderMessage: z.string().optional().nullable(),
  freeDeliveryAbove: z.number().min(0).optional().nullable(),
  deliveryRadiusKm: z.number().positive().optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  acceptCash: z.boolean().optional(),
  acceptPix: z.boolean().optional(),
  acceptCard: z.boolean().optional(),
  acceptOnline: z.boolean().optional(),
  acceptDelivery: z.boolean().optional(),
  acceptPickup: z.boolean().optional(),
  acceptDineIn: z.boolean().optional(),
  allowScheduledOrders: z.boolean().optional(),
  scheduleMinLeadMinutes: z.number().int().min(0).optional(),
  publicMenuSlug: z.string().optional().nullable(),
  themeMode: z.enum(['light', 'dark']).optional(),
  menuSectionsJson: z
    .object({
      favorites: z
        .object({
          kicker: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
      menu: z
        .object({
          kicker: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
      promotions: z
        .object({
          kicker: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
      nav: z
        .object({
          loja: z.string().optional(),
          favoritos: z.string().optional(),
          cardapio: z.string().optional(),
          promocoes: z.string().optional(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  deliveryPolicy: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  termsOfUse: z.string().optional().nullable(),
  extraInfo: z.string().optional().nullable(),
});

const businessHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().optional().nullable(),
  closeTime: z.string().optional().nullable(),
  breakStart: z.string().optional().nullable(),
  breakEnd: z.string().optional().nullable(),
  isClosed: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const replaceBusinessHoursSchema = z.object({
  hours: z.array(businessHourSchema).min(1, 'Informe ao menos um dia.'),
});

export type UpdateEstablishmentInput = z.infer<typeof updateEstablishmentSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ReplaceBusinessHoursInput = z.infer<typeof replaceBusinessHoursSchema>;
