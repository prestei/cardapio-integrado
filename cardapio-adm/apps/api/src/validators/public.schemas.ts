import { z } from 'zod';
import { OrderType, PaymentMethod } from '@prisma/client';

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Informe o cupom.'),
  subtotal: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  customerPhone: z.string().optional(),
});

export const calculateDeliverySchema = z.object({
  neighborhood: z.string().min(1, 'Informe o bairro.'),
  subtotal: z.number().min(0).optional(),
});

const orderItemAdditionalSchema = z.object({
  additionalId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).optional(),
  additionals: z.array(orderItemAdditionalSchema).default([]),
});

const addressSchema = z.object({
  street: z.string().min(1, 'Informe a rua.'),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Informe o bairro.'),
  city: z.string().min(1, 'Informe a cidade.'),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  reference: z.string().optional(),
});

export const createPublicOrderSchema = z
  .object({
    type: z.nativeEnum(OrderType, {
      errorMap: () => ({ message: 'Tipo de pedido inválido.' }),
    }),
    customer: z.object({
      name: z.string().min(2, 'Informe o nome.'),
      phone: z.string().min(8, 'Informe um telefone válido.'),
    }),
    address: addressSchema.optional(),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: 'Forma de pagamento inválida.' }),
    }),
    changeFor: z.number().positive().optional(),
    notes: z.string().max(1000).optional(),
    couponCode: z.string().optional(),
    scheduledFor: z.string().datetime().optional(),
    items: z.array(orderItemSchema).min(1, 'Adicione ao menos um item.'),
  })
  .superRefine((data, ctx) => {
    if (data.type === OrderType.DELIVERY && !data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Endereço é obrigatório para entrega.',
        path: ['address'],
      });
    }
    if (data.paymentMethod === PaymentMethod.CASH && data.changeFor != null) {
      // changeFor is optional; validated against total on the service
    }
  });

export const favoriteQuerySchema = z.object({
  phone: z.string().min(8, 'Informe um telefone válido.'),
});

export const addFavoriteSchema = z.object({
  phone: z.string().min(8, 'Informe um telefone válido.'),
  productId: z.string().min(1, 'Produto é obrigatório.'),
});

export const reorderSchema = z.object({
  phone: z.string().min(8, 'Informe um telefone válido.'),
  orderId: z.string().min(1, 'Pedido é obrigatório.'),
});

export const geoAutocompleteQuerySchema = z.object({
  q: z.string().min(3, 'Informe ao menos 3 caracteres.'),
});

export const geocodeSchema = z.object({
  address: z.string().min(5, 'Informe um endereço válido.'),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CalculateDeliveryInput = z.infer<typeof calculateDeliverySchema>;
export type CreatePublicOrderInput = z.infer<typeof createPublicOrderSchema>;
export type FavoriteQuery = z.infer<typeof favoriteQuerySchema>;
export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type GeoAutocompleteQuery = z.infer<typeof geoAutocompleteQuerySchema>;
export type GeocodeInput = z.infer<typeof geocodeSchema>;
