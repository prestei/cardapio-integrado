import { z } from 'zod';

const confidenceSchema = z.enum(['high', 'medium', 'low']);
const duplicateActionSchema = z.enum(['create', 'update', 'ignore']);

const bboxSchema = z
  .object({
    pageIndex: z.number().int().min(0),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })
  .optional();

const importedAdditionalSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().nullable(),
  confidence: confidenceSchema,
  selected: z.boolean(),
  bbox: bboxSchema,
});

const importedAdditionalGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  selectionType: z.enum(['SINGLE', 'MULTIPLE']).optional(),
  isRequired: z.boolean().optional(),
  minQuantity: z.number().int().min(0).optional(),
  maxQuantity: z.number().int().min(0).nullable().optional(),
  confidence: confidenceSchema,
  selected: z.boolean(),
  additionals: z.array(importedAdditionalSchema),
});

const duplicateMatchSchema = z
  .object({
    existingProductId: z.string(),
    existingName: z.string(),
    existingPrice: z.number(),
    similarity: z.number(),
    action: duplicateActionSchema,
  })
  .optional();

const importedProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().nullable(),
  confidence: confidenceSchema,
  selected: z.boolean(),
  categoryId: z.string(),
  duplicateMatch: duplicateMatchSchema,
  bbox: bboxSchema,
});

const importedCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  confidence: confidenceSchema,
  selected: z.boolean(),
  products: z.array(importedProductSchema),
});

export const updateMenuImportDraftSchema = z.object({
  categories: z.array(importedCategorySchema),
  additionalGroups: z.array(importedAdditionalGroupSchema),
  warnings: z.array(z.string()),
});

export type UpdateMenuImportDraftInput = z.infer<typeof updateMenuImportDraftSchema>;
