import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPageLayoutsFromFile } from '../ocr.service.js';
import { parseMenuFromSpatialPages } from '../spatial-parser.service.js';
import { scoreMenuImportDraft } from './quality.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BURGER_MENU = path.join(__dirname, '__fixtures__', 'burger-menu.png');

describe('Burger menu image (dark background)', () => {
  it(
    'extracts categories and products with prices',
    { timeout: 180_000 },
    async () => {
      const page = await extractPageLayoutsFromFile(BURGER_MENU, 'image/png', 0);
      assert.ok(page, 'OCR should extract layout');
      assert.ok(page!.elements.length >= 15, `expected >= 15 OCR elements, got ${page!.elements.length}`);

      const ocrText = page!.elements
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map((e) => e.text)
        .join('\n');

      const draft = await parseMenuFromSpatialPages([page!], ocrText);
      assert.ok(scoreMenuImportDraft(draft) >= 0.35, `low quality score: ${scoreMenuImportDraft(draft)}`);

      const names = draft.categories.map((c) => c.name.toLowerCase());
      assert.ok(
        names.some((n) => n.includes('simples') || n.includes('especiais') || n.includes('acompanh')),
        `expected burger categories, got: ${draft.categories.map((c) => c.name).join(', ')}`,
      );

      const products = draft.categories.flatMap((c) => c.products);
      assert.ok(products.length >= 8, `expected >= 8 products, got ${products.length}`);

      const withPrice = products.filter((p) => p.price != null && p.price > 0);
      assert.ok(withPrice.length >= 3, `expected prices on items, got ${withPrice.length}`);

      const productNames = products.map((p) => p.name.toLowerCase()).join(' ');
      assert.ok(
        productNames.includes('bacon') || productNames.includes('frango') || productNames.includes('batata'),
        'expected recognizable product names',
      );
    },
  );
});
