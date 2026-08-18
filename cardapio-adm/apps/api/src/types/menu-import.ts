export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type DuplicateAction = 'create' | 'update' | 'ignore';

export interface ImportBBox {
  pageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImportedAdditional {
  id: string;
  name: string;
  price: number | null;
  confidence: ConfidenceLevel;
  selected: boolean;
  bbox?: ImportBBox;
}

export interface ImportedAdditionalGroup {
  id: string;
  name: string;
  selectionType?: 'SINGLE' | 'MULTIPLE';
  isRequired?: boolean;
  minQuantity?: number;
  maxQuantity?: number | null;
  confidence: ConfidenceLevel;
  selected: boolean;
  additionals: ImportedAdditional[];
}

export interface DuplicateMatch {
  existingProductId: string;
  existingName: string;
  existingPrice: number;
  similarity: number;
  action: DuplicateAction;
}

export interface ProductConfidenceBreakdown {
  name: number;
  description: number;
  price: number;
  association: number;
  overall: number;
}

export interface ImportedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  confidence: ConfidenceLevel;
  confidenceScore?: number;
  needsReview?: boolean;
  reviewReason?: string;
  selected: boolean;
  categoryId: string;
  duplicateMatch?: DuplicateMatch;
  bbox?: ImportBBox;
  descriptionBbox?: ImportBBox;
  priceBbox?: ImportBBox;
  confidenceBreakdown?: ProductConfidenceBreakdown;
  sourceBlockIds?: {
    name?: string;
    descriptions: string[];
    price?: string;
  };
}

export interface ImportedCategory {
  id: string;
  name: string;
  confidence: ConfidenceLevel;
  confidenceScore?: number;
  selected: boolean;
  bbox?: ImportBBox;
  products: ImportedProduct[];
}

export interface MenuImportLayoutMeta {
  pageWidth: number;
  pageHeight: number;
  columnCount: number;
}

export interface MenuImportDebugOverlay {
  enabled: boolean;
  blocks: Array<{
    id: string;
    text: string;
    type: string;
    bbox: ImportBBox;
    columnIndex?: number;
    regionId?: string;
  }>;
  columns: Array<{ index: number; leftPct: number; rightPct: number }>;
  regions: Array<{
    id: string;
    columnIndex: number;
    name?: string;
    bbox: ImportBBox;
  }>;
  gaps: Array<{ columnIndex: number; topPct: number; bottomPct: number; isImageGap: boolean }>;
}

export interface MenuImportDraft {
  categories: ImportedCategory[];
  additionalGroups: ImportedAdditionalGroup[];
  warnings: string[];
  layoutMeta?: MenuImportLayoutMeta;
  debug?: MenuImportDebugOverlay;
}

export type ProcessingStepKey =
  | 'uploaded'
  | 'analyzed'
  | 'text_extracted'
  | 'products_identified'
  | 'categories_organized'
  | 'ready_for_review';

export type ProcessingStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface ProcessingStep {
  key: ProcessingStepKey;
  label: string;
  status: ProcessingStepStatus;
}

export const DEFAULT_PROCESSING_STEPS: ProcessingStep[] = [
  { key: 'uploaded', label: 'Arquivo enviado', status: 'pending' },
  { key: 'analyzed', label: 'Documento analisado', status: 'pending' },
  { key: 'text_extracted', label: 'Texto extraído', status: 'pending' },
  { key: 'products_identified', label: 'Identificando produtos', status: 'pending' },
  { key: 'categories_organized', label: 'Organizando categorias', status: 'pending' },
  { key: 'ready_for_review', label: 'Preparando importação', status: 'pending' },
];
