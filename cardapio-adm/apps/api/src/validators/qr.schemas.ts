import { z } from 'zod';
import { QrCodeKind } from '@prisma/client';

export const createQrCodeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  kind: z.nativeEnum(QrCodeKind).optional(),
  targetPath: z.string().optional(),
  tableLabel: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateQrCodeSchema = createQrCodeSchema.partial();

export type CreateQrCodeInput = z.infer<typeof createQrCodeSchema>;
export type UpdateQrCodeInput = z.infer<typeof updateQrCodeSchema>;
