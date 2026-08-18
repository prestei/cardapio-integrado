import type { TextBlock } from './types.js';
import {
  detectCategoryLabel,
  isCategoryText,
  isDescriptionText,
  isFooterText,
  isGarbageText,
  isMenuTitle,
  isProductText,
  parseNumberedProduct,
} from '../layout/classify.js';
import { isLikelyPriceLine, isStandalonePrice, parseOcrPriceToken } from '../price.utils.js';

export function detectPrices(blocks: TextBlock[]): TextBlock[] {
  return blocks.map((block) => {
    const priceValue = parseOcrPriceToken(block.text) ?? null;
    if (priceValue != null && (isStandalonePrice(block.text) || block.text.length <= 10)) {
      return { ...block, type: 'price' as const, priceValue };
    }
    const inline = parseNumberedProduct(block.text);
    if (inline?.price != null) {
      return { ...block, priceValue: inline.price };
    }
    return block;
  });
}

export function classifyBlocks(blocks: TextBlock[]): TextBlock[] {
  const heights = blocks.map((b) => b.bbox.height).filter((h) => h > 4);
  const medianHeight =
    heights.length > 0
      ? heights.sort((a, b) => a - b)[Math.floor(heights.length / 2)]
      : 16;

  return blocks
    .map((block) => {
      const text = block.text.trim();
      if (!text || isGarbageText(text)) {
        return { ...block, type: 'decorative' as const };
      }
      if (isFooterText(text) || isMenuTitle(text)) {
        return { ...block, type: 'decorative' as const };
      }

      const relativeHeight = block.bbox.height / medianHeight;

      if (block.type === 'price' || block.priceValue != null) {
        return { ...block, type: 'price' as const, relativeHeight };
      }
      if (block.type === 'category') {
        return { ...block, relativeHeight };
      }
      if (block.type === 'description') {
        return { ...block, relativeHeight };
      }
      if (block.type === 'product') {
        return { ...block, relativeHeight };
      }
      if (isLikelyPriceLine(text) && text.length <= 12) {
        const pv = parseOcrPriceToken(text);
        return { ...block, type: 'price' as const, priceValue: pv, relativeHeight };
      }
      if (parseNumberedProduct(text)) {
        return { ...block, type: 'product' as const, relativeHeight };
      }
      if (isCategoryText(text)) {
        return { ...block, type: 'category' as const, relativeHeight };
      }
      if (isDescriptionText(text)) {
        return { ...block, type: 'description' as const, relativeHeight };
      }
      if (isProductText(text)) {
        return { ...block, type: 'product' as const, relativeHeight };
      }
      if (text.length >= 8 && text.length <= 220) {
        return { ...block, type: 'description' as const, relativeHeight };
      }
      return { ...block, type: 'unknown' as const, relativeHeight };
    })
    .filter((b) => b.type !== 'decorative' && b.type !== 'title');
}

export function enrichCategoryHints(blocks: TextBlock[]): TextBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'category') return block;
    const label = detectCategoryLabel(block.text);
    if (label) return { ...block, text: label };
    return block;
  });
}

export function normalizeBlockText(blocks: TextBlock[]): TextBlock[] {
  return blocks.map((b) => ({
    ...b,
    text: b.text.replace(/\s+/g, ' ').trim(),
  }));
}
