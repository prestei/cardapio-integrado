import { prisma } from '../../lib/prisma.js';
import type { MenuImportDraft } from '../../types/menu-import.js';

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.88;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.startsWith(shorter.slice(0, Math.max(3, shorter.length - 1)))) return 0.75;
  return 0;
}

export async function attachDuplicateMatches(
  establishmentId: string,
  draft: MenuImportDraft,
): Promise<MenuImportDraft> {
  const existingProducts = await prisma.product.findMany({
    where: { establishmentId },
    select: { id: true, name: true, price: true },
  });

  const next: MenuImportDraft = structuredClone(draft);

  for (const category of next.categories) {
    for (const product of category.products) {
      let best: { id: string; name: string; price: number; similarity: number } | null = null;

      for (const existing of existingProducts) {
        const similarity = nameSimilarity(product.name, existing.name);
        if (similarity >= 0.75 && (!best || similarity > best.similarity)) {
          best = {
            id: existing.id,
            name: existing.name,
            price: Number(existing.price),
            similarity,
          };
        }
      }

      if (best) {
        product.duplicateMatch = {
          existingProductId: best.id,
          existingName: best.name,
          existingPrice: best.price,
          similarity: best.similarity,
          action: product.duplicateMatch?.action ?? 'create',
        };
      } else {
        delete product.duplicateMatch;
      }
    }
  }

  return next;
}
