import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildTestPage } from '../layout/engine.js';
import type { LayoutElement } from '../layout/types.js';
import { buildMenuStructure, detectColumns } from './index.js';
import { pageLayoutsToTextBlocks } from './adapters.js';

function el(
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: LayoutElement['type'] = 'other',
) {
  return { text, x, y, width, height, type };
}

describe('Menu import pipeline', () => {
  it('detectColumns finds 2 columns dynamically', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('SOBREMESAS', 520, 100, 200, 28, 'category'),
        el('01 - Fritas', 80, 150, 220, 22, 'product'),
        el('01 - Brigadeiro', 520, 150, 220, 22, 'product'),
      ],
      1000,
      900,
    );
    const blocks = pageLayoutsToTextBlocks([page]);
    const columns = detectColumns(blocks, page.width);
    assert.equal(columns.length, 2);
  });

  it('buildMenuStructure associates product description and price', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('01 - Fritas', 80, 150, 220, 22, 'product'),
        el('Porção de batata palito frita, bem sequinha.', 80, 178, 280, 30, 'description'),
        el('25,90', 420, 155, 55, 22, 'price'),
      ],
      600,
      500,
    );

    const { parsed } = buildMenuStructure([page]);
    assert.ok(parsed.categories.length >= 1);
    const product = parsed.categories[0]?.products[0];
    assert.ok(product);
    assert.match(product.name, /Fritas/i);
    assert.ok(product.description?.includes('batata'));
    assert.equal(product.price, 25.9);
    assert.ok(product.confidence.overall >= 0.7);
  });

  it('does not invent price when missing', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('Fritas', 80, 150, 220, 22, 'product'),
      ],
      600,
      400,
    );
    const { parsed } = buildMenuStructure([page]);
    const product = parsed.categories.flatMap((c) => c.products)[0];
    assert.ok(product);
    assert.equal(product.price, null);
    assert.equal(product.needsReview, true);
  });

  it('detectColumns finds 1 and 3 columns', () => {
    const oneCol = buildTestPage([el('ENTRADAS', 80, 100, 200, 28, 'category')], 600, 800);
    assert.equal(detectColumns(pageLayoutsToTextBlocks([oneCol]), oneCol.width).length, 1);

    const threeColItems: ReturnType<typeof el>[] = [
      el('COL A', 60, 100, 120, 28, 'category'),
      el('COL B', 310, 100, 120, 28, 'category'),
      el('COL C', 560, 100, 120, 28, 'category'),
    ];
    [60, 310, 560].forEach((x, col) => {
      threeColItems.push(el('01 - Item', x, 150, 140, 22, 'product'));
      threeColItems.push(el('10,00', x + 160, 155, 55, 22, 'price'));
    });
    const threeCol = buildTestPage(threeColItems, 900, 600);
    assert.equal(detectColumns(pageLayoutsToTextBlocks([threeCol]), threeCol.width).length, 3);
  });

  it('associates price below product in same column', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('Fritas', 80, 150, 220, 22, 'product'),
        el('Porção de batata.', 80, 178, 280, 30, 'description'),
        el('R$ 25,90', 80, 215, 80, 22, 'price'),
      ],
      600,
      500,
    );
    const { parsed } = buildMenuStructure([page]);
    const product = parsed.categories[0]?.products[0];
    assert.equal(product?.price, 25.9);
  });

  it('multi-line description merges into one field', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('01 - Fritas', 80, 150, 220, 22, 'product'),
        el('Porção de batata palito frita,', 80, 178, 280, 20, 'description'),
        el('bem sequinha e crocante.', 80, 200, 280, 20, 'description'),
        el('25,90', 420, 155, 55, 22, 'price'),
      ],
      600,
      500,
    );
    const { parsed } = buildMenuStructure([page]);
    const product = parsed.categories[0]?.products[0];
    assert.ok(product?.description?.includes('sequinha'));
    assert.ok(product?.description?.includes('batata'));
  });

  it('parses prices with and without R$ prefix', () => {
    for (const [priceText, expected] of [
      ['25,90', 25.9],
      ['R$ 19,90', 19.9],
      ['R$25,90', 25.9],
    ] as const) {
      const page = buildTestPage(
        [
          el('ENTRADAS', 80, 100, 200, 28, 'category'),
          el('Item', 80, 150, 220, 22, 'product'),
          el(priceText, 420, 155, 80, 22, 'price'),
        ],
        600,
        400,
      );
      const { parsed } = buildMenuStructure([page]);
      assert.equal(parsed.categories[0]?.products[0]?.price, expected, priceText);
    }
  });

  it('image gap does not merge distant categories', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('01 - Fritas', 80, 150, 220, 22, 'product'),
        el('25,90', 420, 155, 55, 22, 'price'),
        el('SOBREMESAS', 80, 520, 200, 28, 'category'),
        el('01 - Brigadeiro', 80, 570, 220, 22, 'product'),
        el('19,90', 420, 575, 55, 22, 'price'),
      ],
      600,
      800,
    );
    const { parsed } = buildMenuStructure([page]);
    assert.equal(parsed.categories.length, 2);
    assert.equal(parsed.categories[0]?.products.length, 1);
    assert.equal(parsed.categories[1]?.products.length, 1);
  });

  it('2x2 grid keeps columns separate', () => {
    const items: ReturnType<typeof el>[] = [
      el('ENTRADAS', 80, 120, 220, 30, 'category'),
      el('SOBREMESAS', 520, 120, 220, 30, 'category'),
    ];
    const left = ['Fritas', 'Dadinho', 'Torresmo', 'Saladinha'];
    const right = ['Brigadeiro', 'Merengue', 'Pudim', 'Frutas da estação'];
    left.forEach((n, i) => {
      items.push(el(String(i + 1).padStart(2, '0') + ' - ' + n, 80, 170 + i * 85, 220, 22, 'product'));
      items.push(el('Desc ' + n, 80, 198 + i * 85, 280, 30, 'description'));
      items.push(el(String(20 + i) + ',90', 420, 175 + i * 85, 55, 22, 'price'));
    });
    right.forEach((n, i) => {
      items.push(el(String(i + 1).padStart(2, '0') + ' - ' + n, 520, 170 + i * 85, 220, 22, 'product'));
      items.push(el('Desc ' + n, 520, 198 + i * 85, 280, 30, 'description'));
      items.push(el(String(15 + i) + ',90', 720, 175 + i * 85, 55, 22, 'price'));
    });
    items.push(el('PRATOS PRINCIPAIS', 80, 620, 260, 30, 'category'));
    items.push(el('BEBIDAS', 520, 620, 200, 30, 'category'));

    const page = buildTestPage(items, 1000, 1100);
    const { parsed } = buildMenuStructure([page]);
    assert.equal(parsed.columnCount, 2);
    const entradas = parsed.categories.find((c) => c.name === 'Entradas');
    const sobremesas = parsed.categories.find((c) => c.name === 'Sobremesas');
    assert.ok(entradas);
    assert.ok(sobremesas);
    assert.equal(entradas!.products.length, 4);
    assert.equal(sobremesas!.products.length, 4);
    assert.ok(entradas!.products.every((p) => !p.name.includes('Brigadeiro')));
  });
});
