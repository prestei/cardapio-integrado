import { randomUUID } from 'node:crypto';
import type {
  ConfidenceLevel,
  ImportedAdditional,
  ImportedAdditionalGroup,
  ImportedCategory,
  ImportedProduct,
  MenuImportDraft,
} from '../../types/menu-import.js';
import {
  extractPriceFromLine,
  isLikelyPriceLine,
  isStandalonePrice,
  parseBrazilianPrice,
} from './price.utils.js';

const CATEGORY_HINTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bentradas?\b/i, label: 'Entradas' },
  { pattern: /\bsobremesas?\b/i, label: 'Sobremesas' },
  { pattern: /\bpratos?\s+principais?\b/i, label: 'Pratos principais' },
  { pattern: /\bbebidas?\b/i, label: 'Bebidas' },
  { pattern: /\badicionais?\b/i, label: 'Adicionais' },
  { pattern: /\bpor[cç][õo]es?\b/i, label: 'Porções' },
  { pattern: /\bpizzas?\b/i, label: 'Pizzas' },
  { pattern: /\bhamb[uú]rgueres?\b/i, label: 'Hambúrgueres' },
  { pattern: /\blanches?\b/i, label: 'Lanches' },
  { pattern: /\bcombos?\b/i, label: 'Combos' },
  { pattern: /\bsaladas?\b/i, label: 'Saladas' },
  { pattern: /\bmassas?\b/i, label: 'Massas' },
  { pattern: /\bacompanhamentos?\b/i, label: 'Acompanhamentos' },
  { pattern: /\bsimples?\b/i, label: 'Simples' },
  { pattern: /\bespeciais?\b/i, label: 'Especiais' },
];

const NUMBERED_ITEM =
  /^(\d{1,2})\s*[-–—.:]?\s*(.+?)(?:\s+\d{1,3},\d{2})?\s*$/;
const MENU_TITLE = /^card[aá]pio$/i;

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function detectCategoriesInLine(line: string): string[] {
  const found: string[] = [];
  for (const hint of CATEGORY_HINTS) {
    if (hint.pattern.test(line)) {
      found.push(hint.label);
    }
  }
  return found;
}

function isLikelyCategoryLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;
  if (/\d{1,2}\s*[-–—]/.test(trimmed)) return false;
  if (isLikelyPriceLine(trimmed)) return false;
  if (MENU_TITLE.test(trimmed)) return false;

  const categories = detectCategoriesInLine(trimmed);
  if (categories.length > 0) return true;

  const letters = trimmed.replace(/[^a-zA-ZÀ-ú]/g, '');
  if (letters.length >= 4 && letters === letters.toUpperCase()) return true;

  return false;
}

function isLikelyAdditionalSection(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('adicional') || lower.includes('extra');
}

function isGarbageLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2) return true;

  const letters = trimmed.replace(/[^a-zA-ZÀ-ú]/g, '');
  if (letters.length < 2) return true;

  const vowels = (letters.match(/[aeiouáéíóúàèìòùâêîôûãõAEIOU]/g) ?? []).length;
  if (letters.length >= 6 && vowels / letters.length < 0.12) return true;

  if (/^[A-ZÀ-Ú\s\-–—]{2,12}$/.test(trimmed) && trimmed.split(/\s+/).every((w) => w.length <= 3)) {
    return true;
  }

  return false;
}

function parseNumberedItem(line: string): { code: string; name: string; price: number | null } | null {
  const match = line.match(NUMBERED_ITEM);
  if (!match) return null;

  const namePart = match[2].trim();
  const { price, rest } = extractPriceFromLine(namePart);
  const name = rest.replace(/\s+\d{1,3},\d{2}\s*$/, '').trim();

  if (name.length < 2) return null;

  return {
    code: match[1],
    name,
    price,
  };
}

function parseAdditionalLine(line: string): ImportedAdditional | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  const plusMatch = trimmed.match(/^(.+?)\s*(?:\+|—|-)\s*(R?\$?\s*[\d.,]+)\s*$/i);
  if (plusMatch) {
    const price = parseBrazilianPrice(plusMatch[2]);
    return {
      id: randomUUID(),
      name: plusMatch[1].trim(),
      price,
      confidence: price != null ? 'high' : 'low',
      selected: true,
    };
  }

  const { price, rest } = extractPriceFromLine(trimmed);
  if (price != null && rest.length >= 2) {
    return {
      id: randomUUID(),
      name: rest,
      price,
      confidence: 'high',
      selected: true,
    };
  }

  return null;
}

function confidenceForProduct(
  price: number | null,
  description: string | null,
): ConfidenceLevel {
  if (price == null) return 'low';
  if (description) return 'high';
  return 'medium';
}

interface PendingProduct {
  name: string;
  descriptionLines: string[];
  price: number | null;
}

function parseColumnLines(lines: string[]): { categoryName: string | null; products: ImportedProduct[] } {
  const products: ImportedProduct[] = [];
  const warnings: string[] = [];
  let categoryName: string | null = null;
  let pending: PendingProduct | null = null;

  const flush = () => {
    if (!pending?.name) {
      pending = null;
      return;
    }

    const description =
      pending.descriptionLines.length > 0
        ? pending.descriptionLines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 280)
        : null;

    products.push({
      id: randomUUID(),
      name: pending.name,
      description,
      price: pending.price,
      confidence: confidenceForProduct(pending.price, description),
      selected: true,
      categoryId: '',
    });

    if (pending.price == null) {
      warnings.push(`Preço não identificado para "${pending.name}".`);
    }

    pending = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || isGarbageLine(line)) continue;
    if (MENU_TITLE.test(line)) continue;

    const categoriesInLine = detectCategoriesInLine(line);
    if (categoriesInLine.length === 1 && line.length <= 40) {
      flush();
      categoryName = categoriesInLine[0];
      continue;
    }

    if (isLikelyCategoryLine(line) && !parseNumberedItem(line)) {
      flush();
      const detected = detectCategoriesInLine(line);
      categoryName = detected[0] ?? titleCase(line);
      continue;
    }

    if (isStandalonePrice(line)) {
      const price = parseBrazilianPrice(line);
      if (pending) {
        pending.price = price;
        flush();
      }
      continue;
    }

    const numbered = parseNumberedItem(line);
    if (numbered) {
      flush();
      pending = {
        name: numbered.name,
        descriptionLines: [],
        price: numbered.price,
      };
      if (numbered.price != null) flush();
      continue;
    }

    const { price, rest } = extractPriceFromLine(line);
    if (price != null && rest.length >= 2 && rest.length <= 80) {
      flush();
      pending = { name: rest, descriptionLines: [], price };
      flush();
      continue;
    }

    if (isLikelyPriceLine(line) && pending && pending.price == null) {
      pending.price = parseBrazilianPrice(line);
      flush();
      continue;
    }

    if (pending && pending.price == null && pending.descriptionLines.length < 2) {
      if (line.length >= 8 && line.length <= 160 && !isLikelyCategoryLine(line)) {
        pending.descriptionLines.push(line);
        continue;
      }
    }

    if (!pending && line.length >= 3 && line.length <= 70 && !isLikelyPriceLine(line)) {
      flush();
      pending = { name: line, descriptionLines: [], price: null };
      continue;
    }
  }

  flush();

  return { categoryName, products };
}

function parseMenuColumns(columnBlocks: string[][]): MenuImportDraft {
  const categories: ImportedCategory[] = [];
  const warnings: string[] = [];

  for (const lines of columnBlocks) {
    const { categoryName, products } = parseColumnLines(lines);
    if (products.length === 0) continue;

    const cat: ImportedCategory = {
      id: randomUUID(),
      name: categoryName ?? 'Geral',
      confidence: categoryName ? 'high' : 'medium',
      selected: true,
      products: products.map((p) => ({ ...p, categoryId: '' })),
    };

    for (const p of cat.products) {
      p.categoryId = cat.id;
    }

    categories.push(cat);
  }

  return { categories, additionalGroups: [], warnings };
}

export function parseMenuText(ocrText: string): MenuImportDraft {
  const blocks = ocrText.split(/\n\s*---\s*\n/);
  const columnBlocks: string[][] = [];

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    if (blocks.length > 1) {
      columnBlocks.push(lines);
    } else {
      columnBlocks.push(lines);
    }
  }

  if (columnBlocks.length > 1) {
    return parseMenuColumns(columnBlocks);
  }

  const lines = columnBlocks[0] ?? [];
  const categories: ImportedCategory[] = [];
  const additionalGroups: ImportedAdditionalGroup[] = [];
  const warnings: string[] = [];

  let currentCategory: ImportedCategory | null = null;
  let currentAdditionalGroup: ImportedAdditionalGroup | null = null;
  let pending: PendingProduct | null = null;

  const ensureCategory = (name: string) => {
    currentCategory = {
      id: randomUUID(),
      name,
      confidence: 'medium',
      selected: true,
      products: [],
    };
    categories.push(currentCategory);
  };

  const flush = () => {
    if (!pending?.name) {
      pending = null;
      return;
    }

    const description =
      pending.descriptionLines.length > 0
        ? pending.descriptionLines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 280)
        : null;

    const product: ImportedProduct = {
      id: randomUUID(),
      name: pending.name,
      description,
      price: pending.price,
      confidence: confidenceForProduct(pending.price, description),
      selected: true,
      categoryId: currentCategory?.id ?? '',
    };

    if (product.price == null) {
      warnings.push(`Preço não identificado para "${product.name}".`);
    }

    if (!currentCategory) {
      ensureCategory('Geral');
    }

    product.categoryId = currentCategory!.id;
    currentCategory!.products.push(product);
    pending = null;
  };

  const flushAdditionalGroup = () => {
    if (currentAdditionalGroup && currentAdditionalGroup.additionals.length > 0) {
      additionalGroups.push(currentAdditionalGroup);
    }
    currentAdditionalGroup = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || isGarbageLine(line)) continue;
    if (MENU_TITLE.test(line)) continue;

    const splitCategories = detectCategoriesInLine(line);
    if (splitCategories.length > 1 && line.length <= 50) {
      flush();
      flushAdditionalGroup();
      continue;
    }

    if (isLikelyCategoryLine(line) && !parseNumberedItem(line)) {
      flush();
      flushAdditionalGroup();

      if (isLikelyAdditionalSection(line)) {
        currentAdditionalGroup = {
          id: randomUUID(),
          name: detectCategoriesInLine(line)[0] ?? line,
          confidence: 'medium',
          selected: true,
          additionals: [],
        };
        currentCategory = null;
        continue;
      }

      const catName = detectCategoriesInLine(line)[0] ?? titleCase(line);
      ensureCategory(catName);
      continue;
    }

    if (currentAdditionalGroup) {
      const additional = parseAdditionalLine(line);
      if (additional) {
        currentAdditionalGroup.additionals.push(additional);
        continue;
      }
    }

    if (isStandalonePrice(line)) {
      const price = parseBrazilianPrice(line);
      if (pending) {
        pending.price = price;
        flush();
      }
      continue;
    }

    const numbered = parseNumberedItem(line);
    if (numbered) {
      flush();
      pending = {
        name: numbered.name,
        descriptionLines: [],
        price: numbered.price,
      };
      if (numbered.price != null) flush();
      continue;
    }

    const { price, rest } = extractPriceFromLine(line);
    if (price != null && rest.length >= 2) {
      flush();
      pending = { name: rest, descriptionLines: [], price };
      flush();
      continue;
    }

    if (pending && pending.price == null && pending.descriptionLines.length < 2) {
      if (line.length >= 8 && line.length <= 160) {
        pending.descriptionLines.push(line);
        continue;
      }
    }

    if (!pending && line.length >= 2 && line.length <= 70 && !isLikelyPriceLine(line)) {
      flush();
      pending = { name: line, descriptionLines: [], price: null };
    }
  }

  flush();
  flushAdditionalGroup();

  if (categories.length === 0 && additionalGroups.length === 0) {
    warnings.push('Não conseguimos identificar o texto desta imagem.');
  }

  return { categories, additionalGroups, warnings };
}

export async function structureMenuWithAi(
  ocrText: string,
  heuristicDraft: MenuImportDraft,
): Promise<MenuImportDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || ocrText.trim().length < 20) {
    return heuristicDraft;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Você extrai cardápios de restaurantes brasileiros a partir de texto OCR.
Regras rígidas:
- Extraia SOMENTE informações presentes no texto.
- NUNCA invente preços, produtos, ingredientes ou categorias.
- Separe corretamente: nome do produto, descrição (1-2 linhas) e preço.
- Cada produto numerado (ex: "01 - Fritas") é um item separado.
- Preços no formato brasileiro: 22,90 -> 22.90
- Se o preço não estiver claro, use null.
- Retorne JSON: { "categories": [{ "name", "confidence": "high"|"medium"|"low", "products": [{ "name", "description", "price", "confidence" }] }], "additionalGroups": [], "warnings": [] }`,
          },
          { role: 'user', content: ocrText.slice(0, 12000) },
        ],
      }),
    });

    if (!response.ok) return heuristicDraft;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return heuristicDraft;

    const parsed = JSON.parse(content) as {
      categories?: Array<{
        name: string;
        confidence?: ConfidenceLevel;
        products?: Array<{
          name: string;
          description?: string | null;
          price?: number | null;
          confidence?: ConfidenceLevel;
        }>;
      }>;
      additionalGroups?: Array<{
        name: string;
        confidence?: ConfidenceLevel;
        additionals?: Array<{
          name: string;
          price?: number | null;
          confidence?: ConfidenceLevel;
        }>;
      }>;
      warnings?: string[];
    };

    const categories: ImportedCategory[] = (parsed.categories ?? []).map((cat) => ({
      id: randomUUID(),
      name: cat.name,
      confidence: cat.confidence ?? 'medium',
      selected: true,
      products: (cat.products ?? []).map((p) => ({
        id: randomUUID(),
        name: p.name,
        description: p.description ?? null,
        price: p.price ?? null,
        confidence: p.confidence ?? (p.price != null ? 'high' : 'low'),
        selected: true,
        categoryId: '',
      })),
    }));

    for (const cat of categories) {
      for (const p of cat.products) {
        p.categoryId = cat.id;
      }
    }

    const additionalGroups: ImportedAdditionalGroup[] = (parsed.additionalGroups ?? []).map(
      (g) => ({
        id: randomUUID(),
        name: g.name,
        confidence: g.confidence ?? 'medium',
        selected: true,
        additionals: (g.additionals ?? []).map((a) => ({
          id: randomUUID(),
          name: a.name,
          price: a.price ?? null,
          confidence: a.confidence ?? (a.price != null ? 'high' : 'low'),
          selected: true,
        })),
      }),
    );

    if (categories.length === 0 && additionalGroups.length === 0) {
      return heuristicDraft;
    }

    return {
      categories,
      additionalGroups,
      warnings: parsed.warnings ?? heuristicDraft.warnings,
    };
  } catch {
    return heuristicDraft;
  }
}
