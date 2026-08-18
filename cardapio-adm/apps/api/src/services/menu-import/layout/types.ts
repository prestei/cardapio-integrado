export type LayoutElementType =
  | 'category'
  | 'product'
  | 'description'
  | 'price'
  | 'title'
  | 'other';

export interface LayoutElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  type: LayoutElementType;
  columnIndex?: number;
  pageIndex: number;
}

export interface PageLayout {
  pageIndex: number;
  width: number;
  height: number;
  elements: LayoutElement[];
}

export interface ColumnLayout {
  index: number;
  left: number;
  right: number;
  centerX: number;
}

export interface CategorySection {
  name: string;
  nameElement: LayoutElement;
  columnIndex: number;
  top: number;
  bottom: number;
  elements: LayoutElement[];
}

export interface ProductGroup {
  name: string;
  nameElement: LayoutElement;
  descriptionElements: LayoutElement[];
  priceElement: LayoutElement | null;
  price: number | null;
  columnIndex: number;
  sectionName: string;
  confidenceScore: number;
  needsReview: boolean;
  reviewReason?: string;
}

export interface SpatialParseResult {
  pageWidth: number;
  pageHeight: number;
  columnCount: number;
  sections: CategorySection[];
  products: ProductGroup[];
}
