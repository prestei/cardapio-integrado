import type { MenuImportDraft } from '../../../types/menu-import.js';
import { isGarbageText } from './classify.js';

const PRODUCT_LIKE_CATEGORY =
  /\b(batata|refrigerante|suco|an[eé]is|grd|pq\.|litros|lata)\b/i;

export function scoreMenuImportDraft(draft: MenuImportDraft): number {
  const products = draft.categories.flatMap((c) => c.products);
  if (products.length === 0) return 0;

  let score = 0;

  const withPrice = products.filter((p) => p.price != null && p.price > 0).length;
  score += (withPrice / products.length) * 0.35;

  const validNames = products.filter(
    (p) => p.name.length >= 4 && !isGarbageText(p.name),
  ).length;
  score += (validNames / products.length) * 0.35;

  const validCategories = draft.categories.filter(
    (c) =>
      c.products.length > 0 &&
      c.name.length >= 3 &&
      !PRODUCT_LIKE_CATEGORY.test(c.name) &&
      !isGarbageText(c.name),
  ).length;
  score += Math.min(validCategories / Math.max(draft.categories.length, 1), 1) * 0.2;

  const reviewRatio =
    products.filter((p) => p.needsReview || p.price == null).length / products.length;
  score += (1 - reviewRatio) * 0.1;

  return Math.min(score, 1);
}

export function isDraftUsable(draft: MenuImportDraft): boolean {
  const products = draft.categories.flatMap((c) => c.products);
  if (products.length < 2) return false;
  return scoreMenuImportDraft(draft) >= 0.42;
}
