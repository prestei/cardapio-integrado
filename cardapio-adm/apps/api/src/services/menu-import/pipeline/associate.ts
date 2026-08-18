import type { ColumnLayout, MenuProductCandidate, TextBlock } from './types.js';
import {
  isDescriptionText,
  parseNumberedProduct,
} from '../layout/classify.js';
import { extractPriceFromLine, parseOcrPriceToken } from '../price.utils.js';
import { computeProductConfidence } from './confidence.js';

function bottomY(b: TextBlock): number {
  return b.bbox.y + b.bbox.height;
}

function horizontalOverlap(a: TextBlock, b: TextBlock): number {
  const left = Math.max(a.bbox.x, b.bbox.x);
  const right = Math.min(a.bbox.x + a.bbox.width, b.bbox.x + b.bbox.width);
  return Math.max(0, right - left);
}

export interface PriceAssociationScore {
  product: TextBlock;
  price: TextBlock;
  score: number;
}

export function scorePriceAssociation(
  price: TextBlock,
  product: TextBlock,
  column: ColumnLayout,
  pageHeight: number,
  regionColumnIndex: number,
  nextProductTop: number | null,
): number {
  if (product.columnIndex !== regionColumnIndex) return 0;
  if (price.columnIndex !== regionColumnIndex && price.center.x < column.left - 20) return 0;

  const cx = price.center.x;
  const productCx = product.center.x;
  if (cx < product.bbox.x - 40) return 0;

  const nameBottom = bottomY(product);
  if (price.bbox.y < product.bbox.y - 10) return 0;
  if (nextProductTop != null && price.bbox.y > nextProductTop - 4) return 0;

  const vDist = price.bbox.y - nameBottom;
  const maxVDist = pageHeight * 0.18;
  if (vDist > maxVDist) return 0;

  let score = 0.35;

  const vNorm = 1 - Math.min(Math.max(vDist, 0) / maxVDist, 1);
  score += vNorm * 0.25;

  if (Math.abs(price.center.y - product.center.y) < pageHeight * 0.06) {
    score += 0.2;
  }

  const overlap = horizontalOverlap(price, product);
  const nameWidth = product.bbox.width || 1;
  if (overlap / nameWidth > 0.05) score += 0.08;

  if (cx >= productCx - 30) score += 0.12;

  if (price.columnIndex === regionColumnIndex) score += 0.15;
  else score -= 0.35;

  return Math.min(Math.max(score, 0), 1);
}

export function associatePricesToProducts(
  products: TextBlock[],
  prices: TextBlock[],
  column: ColumnLayout,
  pageHeight: number,
  regionColumnIndex: number,
): Map<string, TextBlock> {
  const map = new Map<string, TextBlock>();
  const usedPrices = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const nextTop = i + 1 < products.length ? products[i + 1].bbox.y : null;
    let best: { price: TextBlock; score: number } | null = null;

    for (const price of prices) {
      if (usedPrices.has(price.id)) continue;
      const score = scorePriceAssociation(
        price,
        product,
        column,
        pageHeight,
        regionColumnIndex,
        nextTop,
      );
      if (score > 0.45 && (!best || score > best.score)) {
        best = { price, score };
      }
    }

    if (best) {
      map.set(product.id, best.price);
      usedPrices.add(best.price.id);
    }
  }

  for (const price of prices) {
    if (usedPrices.has(price.id)) continue;
    let best: { product: TextBlock; yDist: number } | null = null;
    for (const product of products) {
      if (map.has(product.id)) continue;
      const yDist = Math.abs(price.center.y - product.center.y);
      if (yDist > 28) continue;
      if (!best || yDist < best.yDist) best = { product, yDist };
    }
    if (best) {
      map.set(best.product.id, price);
      usedPrices.add(price.id);
    }
  }

  return map;
}

function isNewProductLine(block: TextBlock): boolean {
  if (parseNumberedProduct(block.text)) return true;
  const inline = extractPriceFromLine(block.text);
  if (inline.price != null && inline.rest.length >= 2 && !isDescriptionText(inline.rest)) return true;
  return block.type === 'product' && !isDescriptionText(block.text);
}

function looksLikeDescription(block: TextBlock): boolean {
  return block.type === 'description' || isDescriptionText(block.text);
}

function attachDescription(
  target: MenuProductCandidate,
  block: TextBlock,
  pageHeight: number,
): boolean {
  if (target.descriptions.length >= 2) return false;
  if (!target.product) return false;
  const vDist = block.bbox.y - bottomY(target.product);
  if (vDist < -5 || vDist > pageHeight * 0.1) return false;
  target.descriptions.push(block);
  return true;
}

/** Group blocks inside a region into product candidates with descriptions and prices. */
export function buildProductCandidatesInRegion(
  blocks: TextBlock[],
  column: ColumnLayout,
  pageHeight: number,
  regionColumnIndex: number,
): MenuProductCandidate[] {
  const sorted = [...blocks].sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);
  const productBlocks: TextBlock[] = [];
  const priceBlocks: TextBlock[] = [];
  const candidates: MenuProductCandidate[] = [];
  let pending: MenuProductCandidate | null = null;

  const flush = () => {
    if (pending?.product) {
      candidates.push(pending);
    }
    pending = null;
  };

  for (const block of sorted) {
    if (block.type === 'price') {
      priceBlocks.push(block);
      continue;
    }

    if (isNewProductLine(block)) {
      flush();
      const numbered = parseNumberedProduct(block.text);
      const inline = extractPriceFromLine(block.text);
      const name = numbered?.name ?? (inline.price != null ? inline.rest : block.text.trim());
      const inlinePrice = numbered?.price ?? inline.price;
      const productBlock: TextBlock = { ...block, text: name, type: 'product' };
      pending = {
        product: productBlock,
        descriptions: [],
        price: inlinePrice != null ? block : undefined,
        confidence: { name: 0.7, description: 0.5, price: 0.5, association: 0.5, overall: 0.5 },
        needsReview: false,
      };
      if (inlinePrice != null) {
        pending.price = { ...block, priceValue: inlinePrice, type: 'price' };
        productBlocks.push(productBlock);
        flush();
      } else {
        productBlocks.push(productBlock);
      }
      continue;
    }

    if (looksLikeDescription(block)) {
      if (pending && attachDescription(pending, block, pageHeight)) continue;
      if (candidates.length > 0) {
        const last = candidates[candidates.length - 1];
        if (last.price?.priceValue == null && attachDescription(last, block, pageHeight)) continue;
      }
      continue;
    }
  }

  flush();

  const merged: MenuProductCandidate[] = [];
  for (const c of candidates) {
    if (
      merged.length > 0 &&
      c.product &&
      !parseNumberedProduct(c.product.text) &&
      isDescriptionText(c.product.text)
    ) {
      const prev = merged[merged.length - 1];
      prev.descriptions.push(c.product);
      if (c.price?.priceValue != null && !prev.price) prev.price = c.price;
      continue;
    }
    merged.push(c);
  }

  const priceMap = associatePricesToProducts(
    merged.map((c) => c.product!).filter(Boolean),
    priceBlocks,
    column,
    pageHeight,
    regionColumnIndex,
  );

  for (const c of merged) {
    if (!c.product) continue;
    const priceBlock = priceMap.get(c.product.id);
    if (priceBlock && !c.price) c.price = priceBlock;

    const priceVal =
      c.price?.priceValue ?? (c.price ? parseOcrPriceToken(c.price.text) : null);
    const conf = computeProductConfidence(c, priceVal);
    c.confidence = conf;
    c.needsReview = conf.overall < 0.7 || priceVal == null;
    if (priceVal == null) c.reviewReason = 'Preço não identificado';
  }

  return merged.filter((c) => c.product);
}
