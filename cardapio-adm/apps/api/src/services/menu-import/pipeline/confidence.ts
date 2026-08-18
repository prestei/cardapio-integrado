import type { MenuProductCandidate, ProductConfidence } from './types.js';

export function scoreToLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
}

export function computeProductConfidence(
  candidate: MenuProductCandidate,
  priceValue: number | null | undefined,
): ProductConfidence {
  let name = 0.72;
  let description = 0.5;
  let price = 0.45;
  let association = 0.65;

  if (candidate.product) {
    const t = candidate.product.text;
    if (t.length >= 3 && t.length <= 80) name += 0.12;
    if (candidate.product.confidence >= 0.8) name += 0.08;
  }

  if (candidate.descriptions.length > 0) {
    description = 0.88;
    if (candidate.descriptions.length >= 2) description = 0.92;
  }

  if (priceValue != null && priceValue > 0) {
    price = 0.92;
    association += 0.2;
  } else {
    association -= 0.15;
  }

  if (candidate.product && candidate.price) {
    const vDist = Math.abs(candidate.price.center.y - candidate.product.center.y);
    if (vDist < 40) association += 0.12;
    if (candidate.product.columnIndex === candidate.price.columnIndex) association += 0.1;
  }

  name = Math.min(name, 0.98);
  description = Math.min(description, 0.98);
  price = Math.min(price, 0.99);
  association = Math.min(Math.max(association, 0.35), 0.99);

  const overall = name * 0.3 + description * 0.2 + price * 0.3 + association * 0.2;

  return {
    name: Math.round(name * 100) / 100,
    description: Math.round(description * 100) / 100,
    price: Math.round(price * 100) / 100,
    association: Math.round(association * 100) / 100,
    overall: Math.round(overall * 100) / 100,
  };
}

export function categoryConfidence(productCount: number, hasCategoryBlock: boolean): number {
  let score = hasCategoryBlock ? 0.88 : 0.65;
  if (productCount >= 2) score += 0.06;
  if (productCount >= 4) score += 0.04;
  return Math.min(score, 0.98);
}
