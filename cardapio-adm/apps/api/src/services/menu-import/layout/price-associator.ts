import type { ColumnLayout, LayoutElement, ProductGroup } from './types.js';
import {
  bottomY,
  centerX,
  centerY,
  isDescriptionText,
  parseNumberedProduct,
  parsePriceFromElement,
  rightX,
} from './classify.js';
import { extractPriceFromLine } from '../price.utils.js';

interface ProductDraft {
  name: string;
  nameElement: LayoutElement;
  descriptionElements: LayoutElement[];
  priceElement: LayoutElement | null;
  price: number | null;
  columnIndex: number;
  sectionName: string;
}

function looksLikeDescription(el: LayoutElement): boolean {
  return el.type === 'description' || isDescriptionText(el.text);
}

function isNewProductLine(el: LayoutElement): boolean {
  if (parseNumberedProduct(el.text)) return true;
  const inline = extractPriceFromLine(el.text);
  if (inline.price != null && inline.rest.length >= 2 && !isDescriptionText(inline.rest)) return true;
  return el.type === 'product' && !isDescriptionText(el.text);
}

function attachDescription(target: ProductDraft, el: LayoutElement, pageHeight: number): boolean {
  if (target.descriptionElements.length >= 2) return false;
  const vDist = el.y - bottomY(target.nameElement);
  if (vDist < -5 || vDist > pageHeight * 0.1) return false;
  target.descriptionElements.push(el);
  return true;
}

function horizontalOverlap(a: LayoutElement, b: LayoutElement): number {
  const left = Math.max(a.x, b.x);
  const right = Math.min(rightX(a), rightX(b));
  return Math.max(0, right - left);
}

function verticalDistance(from: LayoutElement, to: LayoutElement): number {
  return Math.max(0, to.y - bottomY(from));
}

/** Score how well a price element belongs to a product (0-1). Same column required. */
export function scorePriceAssociation(
  priceEl: LayoutElement,
  product: ProductDraft,
  column: ColumnLayout,
  pageHeight: number,
  nextProductTop: number | null,
): number {
  const cx = centerX(priceEl);
  const productCx = centerX(product.nameElement);

  // Price may be in the same column or further right (typical menu layout)
  if (cx < product.nameElement.x - 40) return 0;
  if (cx > column.right + pageHeight * 0.15) return 0;

  const nameBottom = bottomY(product.nameElement);
  const descBottom =
    product.descriptionElements.length > 0
      ? bottomY(product.descriptionElements[product.descriptionElements.length - 1])
      : nameBottom;
  const productBottom = Math.max(nameBottom, descBottom);

  if (priceEl.y < product.nameElement.y - 8) return 0;
  if (nextProductTop != null && priceEl.y > nextProductTop - 5) return 0;

  const vDist = priceEl.y - productBottom;
  const maxVDist = pageHeight * 0.2;
  if (vDist > maxVDist) return 0;

  let score = 0.45;

  const vNorm = 1 - Math.min(Math.max(vDist, 0) / maxVDist, 1);
  score += vNorm * 0.3;

  if (Math.abs(centerY(priceEl) - centerY(product.nameElement)) < pageHeight * 0.08) {
    score += 0.15;
  }

  const overlap = horizontalOverlap(priceEl, product.nameElement);
  const nameWidth = product.nameElement.width || 1;
  if (overlap / nameWidth > 0.1) score += 0.1;

  if (cx >= productCx - 20) score += 0.1;

  if (product.descriptionElements.length > 0) {
    const descOverlap = product.descriptionElements.some(
      (d) => horizontalOverlap(priceEl, d) / Math.max(d.width, 1) > 0.1,
    );
    if (descOverlap) score += 0.1;
  }

  return Math.min(score, 1);
}

export function associatePriceToProduct(
  priceEl: LayoutElement,
  products: ProductDraft[],
  column: ColumnLayout,
  pageHeight: number,
): ProductDraft | null {
  let best: { product: ProductDraft; score: number } | null = null;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (product.price != null) continue;

    const nextTop = i + 1 < products.length ? products[i + 1].nameElement.y : null;
    const score = scorePriceAssociation(priceEl, product, column, pageHeight, nextTop);
    if (score > 0.4 && (!best || score > best.score)) {
      best = { product, score };
    }
  }

  return best?.product ?? null;
}

export function groupProductsInSection(
  sectionElements: LayoutElement[],
  sectionName: string,
  columnIndex: number,
  column: ColumnLayout,
  pageHeight: number,
): ProductDraft[] {
  const sorted = [...sectionElements].sort((a, b) => a.y - b.y || a.x - b.x);
  const products: ProductDraft[] = [];
  const orphanPrices: LayoutElement[] = [];
  let pending: ProductDraft | null = null;

  const flush = () => {
    if (pending) {
      products.push(pending);
      pending = null;
    }
  };

  for (const el of sorted) {
    if (el.type === 'price') {
      orphanPrices.push(el);
      continue;
    }

    if (isNewProductLine(el)) {
      flush();
      const numbered = parseNumberedProduct(el.text);
      const inline = extractPriceFromLine(el.text);
      const name = numbered?.name ?? (inline.price != null ? inline.rest : el.text.trim());
      const inlinePrice = numbered?.price ?? inline.price;
      pending = {
        name,
        nameElement: el,
        descriptionElements: [],
        priceElement: inlinePrice != null ? el : null,
        price: inlinePrice,
        columnIndex,
        sectionName,
      };
      if (inlinePrice != null) flush();
      continue;
    }

    if (looksLikeDescription(el)) {
      if (pending && pending.price == null && attachDescription(pending, el, pageHeight)) {
        continue;
      }
      if (products.length > 0) {
        const last = products[products.length - 1];
        if (last.price == null && attachDescription(last, el, pageHeight)) {
          continue;
        }
      }
      continue;
    }
  }

  flush();

  // Descriptions misclassified as products become names — merge into previous item
  const merged: ProductDraft[] = [];
  for (const product of products) {
    if (
      merged.length > 0 &&
      !parseNumberedProduct(product.nameElement.text) &&
      isDescriptionText(product.name)
    ) {
      const prev = merged[merged.length - 1];
      prev.descriptionElements.push(product.nameElement);
      if (product.price != null && prev.price == null) {
        prev.price = product.price;
        prev.priceElement = product.priceElement;
      }
      continue;
    }
    merged.push(product);
  }
  products.length = 0;
  products.push(...merged);

  for (const priceEl of orphanPrices) {
    const target = associatePriceToProduct(priceEl, products, column, pageHeight);
    if (target) {
      target.priceElement = priceEl;
      target.price = parsePriceFromElement(priceEl);
    }
  }

  // Second pass: prices may belong to products in same section regardless of column index
  const stillOrphan = orphanPrices.filter((p) => !products.some((prod) => prod.priceElement === p));
  for (const priceEl of stillOrphan) {
    let best: { product: ProductDraft; score: number } | null = null;
    for (let i = 0; i < products.length; i++) {
      if (products[i].price != null) continue;
      const nextTop = i + 1 < products.length ? products[i + 1].nameElement.y : null;
      const score = scorePriceAssociation(priceEl, products[i], column, pageHeight, nextTop);
      if (score > 0.4 && (!best || score > best.score)) best = { product: products[i], score };
    }
    if (best) {
      best.product.priceElement = priceEl;
      best.product.price = parsePriceFromElement(priceEl);
    }
  }

  // Same-row prices (name left, price far right)
  for (const priceEl of orphanPrices) {
    if (products.some((p) => p.priceElement === priceEl)) continue;
    let best: { product: ProductDraft; yDist: number } | null = null;
    for (const product of products) {
      if (product.price != null) continue;
      const yDist = Math.abs(centerY(priceEl) - centerY(product.nameElement));
      if (yDist > 30) continue;
      if (!best || yDist < best.yDist) best = { product, yDist };
    }
    if (best) {
      best.product.priceElement = priceEl;
      best.product.price = parsePriceFromElement(priceEl);
    }
  }

  return products;
}

export function toProductGroup(draft: ProductDraft): ProductGroup {
  let confidenceScore = 0.7;
  let needsReview = false;
  let reviewReason: string | undefined;

  if (draft.price == null) {
    confidenceScore = 0.45;
    needsReview = true;
    reviewReason = 'Preço não identificado';
  } else if (draft.descriptionElements.length > 0) {
    confidenceScore = 0.94;
  } else {
    confidenceScore = 0.82;
  }

  if (parseNumberedProduct(draft.nameElement.text)) {
    confidenceScore = Math.min(confidenceScore + 0.04, 0.98);
  }

  return {
    name: draft.name,
    nameElement: draft.nameElement,
    descriptionElements: draft.descriptionElements,
    priceElement: draft.priceElement,
    price: draft.price,
    columnIndex: draft.columnIndex,
    sectionName: draft.sectionName,
    confidenceScore,
    needsReview,
    reviewReason,
  };
}

export function productBlockElements(group: ProductGroup): LayoutElement[] {
  const els = [group.nameElement, ...group.descriptionElements];
  if (group.priceElement) els.push(group.priceElement);
  return els;
}

export function centerOfElements(elements: LayoutElement[]): { x: number; y: number } {
  if (elements.length === 0) return { x: 0, y: 0 };
  const minX = Math.min(...elements.map((e) => e.x));
  const minY = Math.min(...elements.map((e) => e.y));
  const maxX = Math.max(...elements.map((e) => rightX(e)));
  const maxY = Math.max(...elements.map((e) => bottomY(e)));
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
