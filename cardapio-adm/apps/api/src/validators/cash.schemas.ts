import { z } from 'zod';
import { CashMovementType } from '@prisma/client';

export const openCashRegisterSchema = z.object({
  openingAmount: z.number().min(0, 'Valor de abertura não pode ser negativo.'),
  note: z.string().optional(),
});

export const createCashMovementSchema = z.object({
  type: z.nativeEnum(CashMovementType, { errorMap: () => ({ message: 'Tipo de movimento inválido.' }) }),
  amount: z.number().positive('Valor deve ser maior que zero.'),
  reason: z.string().optional(),
  orderId: z.string().optional(),
});

export const closeCashRegisterSchema = z.object({
  closingAmount: z.number().min(0, 'Valor de fechamento não pode ser negativo.'),
  note: z.string().optional(),
});

export const listCashHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;
export type CreateCashMovementInput = z.infer<typeof createCashMovementSchema>;
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
export type ListCashHistoryQuery = z.infer<typeof listCashHistoryQuerySchema>;
