import { z } from 'zod';
import { OrderStatus, OrderType } from '@prisma/client';

export const listOrdersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  type: z.nativeEnum(OrderType).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Status inválido.' }),
  }),
});

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
