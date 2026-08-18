import { randomUUID } from 'node:crypto';
import type { LayoutElement, LayoutElementType } from './types.js';
import {
  extractPriceFromLine,
  isLikelyPriceLine,
  isStandalonePrice,
  parseBrazilianPrice,
  parseOcrPriceToken,
} from '../price.utils.js';

const CATEGORY_HINTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bentradas?\b/i, label: 'Entradas' },
  { pattern: /\bsobremesas?\b/i, label: 'Sobremesas' },
  { pattern: /\bpratos?\s+principais?\b/i, label: 'Pratos principais' },
  { pattern: /\bbebidas?\b/i, label: 'Bebidas' },
  { pattern: /\badicionais?\b/i, label: 'Adicionais' },
  { pattern: /\bacompanhamentos?\b/i, label: 'Acompanhamentos' },
  { pattern: /\bpor[cç][õo]es?\b/i, label: 'Porções' },
  { pattern: /\bpizzas?\b/i, label: 'Pizzas' },
  { pattern: /\bhamb[uú]rgueres?\b/i, label: 'Hambúrgueres' },
  { pattern: /\bburguers?\b/i, label: 'Burguers' },
  { pattern: /\blanches?\b/i, label: 'Lanches' },
  { pattern: /\bcombos?\b/i, label: 'Combos' },
  { pattern: /\bsaladas?\b/i, label: 'Saladas' },
  { pattern: /\bmassas?\b/i, label: 'Massas' },
  { pattern: /\bsimples?\b/i, label: 'Simples' },
  { pattern: /\bespeciais?\b/i, label: 'Especiais' },
];

export const NUMBERED_ITEM =
  /^(\d{1,2})\s*[-–—.:]?\s*(.+?)(?:\s+\d{1,3},\d{2})?\s*$/;

const MENU_TITLE = /^(?:card[aá]pio|menu(?:\s+burguers?)?|burguers?)$/i;

const PRODUCT_INDICATORS =
  /\b(batata|refrigerante|suco|[áa]gua|cerveja|vinho|an[eé]is|x-|-frango|-bacon|grd|gro|pq\.?|litros|lata|100gr|500gr|queijo|cebola|natural)\b|\d+\s*gr\b/i;

const FOOD_WORDS =
  /\b(alface|tomate|batata|milho|hamb|frango|presunto|mu[çc]arela|mussarela|bacon|salsicha|ovo|fil[eé]|queijo|molho|p[aã]o)\b/i;

export function detectCategoryLabel(text: string): string | null {
  for (const hint of CATEGORY_HINTS) {
    if (hint.pattern.test(text)) return hint.label;
  }
  return null;
}

export function isMenuTitle(text: string): boolean {
  return MENU_TITLE.test(text.trim());
}

export function isFooterText(text: string): boolean {
  const trimmed = text.trim();
  return (
    /\b(rua|avenida|av\.|delivery|cidades?|brasileira|\(\d{2}\)\s*\d|\d{4,}[-\s]\d{4})\b/i.test(trimmed) ||
    /\b\d{3}\s*-/.test(trimmed)
  );
}

export function isGarbageText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (parseOcrPriceToken(trimmed) != null) return false;
  if (isLikelyPriceLine(trimmed)) return false;

  const letters = trimmed.replace(/[^a-zA-ZÀ-ú]/g, '');
  if (letters.length < 2) return true;

  if (trimmed.length <= 4 && !/^\d{1,2}\s*-/.test(trimmed) && !/^[XH]-/i.test(trimmed)) {
    const vowels = (letters.match(/[aeiouáéíóúàèìòùâêîôûãõAEIOU]/gi) ?? []).length;
    if (vowels === 0) return true;
  }

  const vowels = (letters.match(/[aeiouáéíóúàèìòùâêîôûãõAEIOU]/g) ?? []).length;
  if (letters.length >= 6 && vowels / letters.length < 0.12) return true;

  if (/^[A-ZÀ-Ú\s\-–—]{2,12}$/.test(trimmed) && trimmed.split(/\s+/).every((w) => w.length <= 3)) {
    return true;
  }

  return false;
}

export function isCategoryText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 55) return false;
  if (NUMBERED_ITEM.test(trimmed)) return false;
  if (isLikelyPriceLine(trimmed)) return false;
  if (isMenuTitle(trimmed)) return false;
  if (PRODUCT_INDICATORS.test(trimmed)) return false;
  if (/\b(especial|mega|turbo)\b/i.test(trimmed)) return false;
  if (/^[XH][\s-]/i.test(trimmed)) return false;
  if (parseOcrPriceToken(trimmed) != null) return false;

  const detected = detectCategoryLabel(trimmed);
  if (detected) return true;

  const letters = trimmed.replace(/[^a-zA-ZÀ-ú]/g, '');
  const words = trimmed.split(/\s+/);
  if (
    words.length === 1 &&
    letters.length >= 4 &&
    letters === letters.toUpperCase() &&
    !/\d/.test(trimmed) &&
    !/\./.test(trimmed)
  ) {
    return true;
  }

  return false;
}

/** Ingredient / detail lines — not product titles. */
export function isDescriptionText(text: string): boolean {
  const trimmed = text.trim();
  if (NUMBERED_ITEM.test(trimmed)) return false;
  if (isLikelyPriceLine(trimmed)) return false;
  if (isCategoryText(trimmed)) return false;
  if (isMenuTitle(trimmed)) return false;
  if (trimmed.length < 6 || trimmed.length > 220) return false;

  if (/^[a-zà-ú(“"']/.test(trimmed) && !/^\d/.test(trimmed)) {
    return true;
  }

  const commaCount = (trimmed.match(/,/g) ?? []).length;
  if (commaCount >= 2) return true;

  if (FOOD_WORDS.test(trimmed) && commaCount >= 1 && trimmed.length >= 12) {
    return true;
  }

  if (trimmed === trimmed.toUpperCase() && commaCount >= 1 && trimmed.length >= 15 && FOOD_WORDS.test(trimmed)) {
    return true;
  }

  if (/\.\s*$/.test(trimmed) && !/^\d{1,2}\s*[-–—.]/.test(trimmed)) {
    const words = trimmed.replace(/\.\s*$/, '').split(/\s+/);
    const lowerWords = words.filter((w) => w === w.toLowerCase() && /[a-zà-ú]/.test(w));
    if (lowerWords.length >= Math.min(2, words.length)) return true;
  }

  if (
    /^(com|servido|feito|porção|porcao|acompanha|molho|recheio|opcional|também|individual)/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  return false;
}

export function isProductText(text: string): boolean {
  const trimmed = text.trim();
  if (NUMBERED_ITEM.test(trimmed)) return true;
  if (isLikelyPriceLine(trimmed)) return false;
  if (isCategoryText(trimmed)) return false;
  if (isDescriptionText(trimmed)) return false;
  if (trimmed.length < 2 || trimmed.length > 90) return false;

  if (/^[XH][\s-]/i.test(trimmed)) return true;
  if (/\b(ESPECIAL|MEGA|TURBO)\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 5) return true;
  if (PRODUCT_INDICATORS.test(trimmed)) return true;

  return /^[\dA-Za-zÀ-ú]/.test(trimmed);
}

export function parseNumberedProduct(text: string): { code: string; name: string; price: number | null } | null {
  const match = text.trim().match(NUMBERED_ITEM);
  if (!match) return null;

  const namePart = match[2].trim();
  const { price, rest } = extractPriceFromLine(namePart);
  const name = rest.replace(/\s+\d{1,3},\d{2}\s*$/, '').trim();
  if (name.length < 2) return null;

  return { code: match[1], name, price };
}

export function classifyElement(element: LayoutElement): LayoutElementType {
  const text = element.text.trim();
  if (!text || isGarbageText(text)) return 'other';
  if (isFooterText(text)) return 'other';
  if (isMenuTitle(text)) return 'title';
  if (isStandalonePrice(text) || (parseOcrPriceToken(text) != null && text.length <= 8)) return 'price';
  if (isCategoryText(text)) return 'category';
  if (parseNumberedProduct(text)) return 'product';
  if (isDescriptionText(text)) return 'description';
  if (isProductText(text)) return 'product';
  if (text.length >= 8 && text.length <= 200) return 'description';
  return 'other';
}

export function classifyElements(elements: LayoutElement[]): LayoutElement[] {
  return elements
    .map((el) => ({
      ...el,
      type: el.type !== 'other' ? el.type : classifyElement(el),
    }))
    .filter((el) => el.type !== 'other' && el.type !== 'title');
}

export function createElement(
  text: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  pageIndex: number,
  confidence?: number,
): LayoutElement {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  const el: LayoutElement = {
    id: randomUUID(),
    text: trimmed,
    x: x0,
    y: y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
    confidence,
    type: 'other',
    pageIndex,
  };
  el.type = classifyElement(el);
  return el;
}

export function parsePriceFromElement(element: LayoutElement): number | null {
  return parseOcrPriceToken(element.text) ?? parseBrazilianPrice(element.text);
}

export function centerX(el: LayoutElement): number {
  return el.x + el.width / 2;
}

export function centerY(el: LayoutElement): number {
  return el.y + el.height / 2;
}

export function bottomY(el: LayoutElement): number {
  return el.y + el.height;
}

export function rightX(el: LayoutElement): number {
  return el.x + el.width;
}
