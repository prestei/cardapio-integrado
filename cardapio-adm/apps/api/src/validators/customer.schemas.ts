import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').optional(),
  phone: z.string().min(8, 'Telefone inválido.').optional(),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
