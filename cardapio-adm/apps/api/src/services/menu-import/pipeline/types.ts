/** Intermediate pipeline model — never rely on OCR string order alone. */

export type TextBlockType = 'unknown' | 'category' | 'product' | 'description' | 'price' | 'decorative' | 'title';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextBlock {
  id: string;
  text: string;
  bbox: BoundingBox;
  center: { x: number; y: number };
  confidence: number;
  pageIndex: number;
  lineIndex?: number;
  paragraphIndex?: number;
  type: TextBlockType;
  columnIndex?: number;
  regionId?: string;
  /** Parsed numeric price when type=price */
  priceValue?: number | null;
  /** Relative height vs median — helps detect category headers */
  relativeHeight?: number;
}

export interface ColumnLayout {
  index: number;
  left: number;
  right: number;
  centerX: number;
}

export interface LayoutGap {
  columnIndex: number;
  top: number;
  bottom: number;
  /** Large vertical gap likely caused by image/decoration */
  isImageGap: boolean;
}

export interface ProductConfidence {
  name: number;
  description: number;
  price: number;
  association: number;
  overall: number;
}

export interface MenuProductCandidate {
  product?: TextBlock;
  descriptions: TextBlock[];
  price?: TextBlock;
  confidence: ProductConfidence;
  needsReview: boolean;
  reviewReason?: string;
}

export interface MenuRegion {
  id: string;
  columnIndex: number;
  bbox: BoundingBox;
  /** Inclusive vertical bounds for block assignment within the column */
  yTop: number;
  yBottom: number;
  category?: TextBlock;
  products: MenuProductCandidate[];
}

export interface ParsedMenuCategory {
  name: string;
  bbox?: BoundingBox;
  confidence: number;
  columnIndex: number;
  regionId: string;
  products: ParsedMenuProduct[];
}

export interface ParsedMenuProduct {
  name: string;
  description?: string;
  price?: number | null;
  bbox?: BoundingBox;
  descriptionBbox?: BoundingBox;
  priceBbox?: BoundingBox;
  pageIndex: number;
  confidence: ProductConfidence;
  needsReview: boolean;
  reviewReason?: string;
  /** Source block ids for debug / highlight */
  sourceBlockIds: {
    name?: string;
    descriptions: string[];
    price?: string;
  };
}

export interface ParsedMenu {
  pageWidth: number;
  pageHeight: number;
  columnCount: number;
  categories: ParsedMenuCategory[];
  warnings: string[];
}

export interface SemanticCorrection {
  field: 'category' | 'product' | 'description' | 'price';
  regionId?: string;
  productIndex?: number;
  from: string;
  to: string;
  reason?: string;
}

export interface SemanticValidationResult {
  valid: boolean;
  corrections: SemanticCorrection[];
}

export interface PipelineDebugOverlay {
  enabled: boolean;
  blocks: Array<{
    id: string;
    text: string;
    type: TextBlockType;
    bbox: { pageIndex: number; x: number; y: number; w: number; h: number };
    columnIndex?: number;
    regionId?: string;
  }>;
  columns: Array<{ index: number; leftPct: number; rightPct: number }>;
  regions: Array<{
    id: string;
    columnIndex: number;
    name?: string;
    bbox: { pageIndex: number; x: number; y: number; w: number; h: number };
  }>;
  gaps: Array<{ columnIndex: number; topPct: number; bottomPct: number; isImageGap: boolean }>;
}

export interface PipelineResult {
  parsed: ParsedMenu;
  debug: PipelineDebugOverlay;
  semantic?: SemanticValidationResult;
}
