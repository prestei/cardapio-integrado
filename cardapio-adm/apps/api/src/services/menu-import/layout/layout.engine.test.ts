import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTestPage,
  parseSpatialLayout,
  spatialResultToDraft,
} from './engine.js';
import { detectColumnCount } from './columns.js';
import type { LayoutElement } from './types.js';

function el(
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: LayoutElement['type'] = 'other',
): Omit<LayoutElement, 'id' | 'pageIndex'> & { type: LayoutElement['type'] } {
  return { text, x, y, width, height, type };
}

function productBlock(
  code: string,
  name: string,
  desc: string,
  price: string,
  colX: number,
  startY: number,
): Array<Omit<LayoutElement, 'id' | 'pageIndex'> & { type: LayoutElement['type'] }> {
  return [
    el(`${code} - ${name}`, colX, startY, 220, 22, 'product'),
    el(desc, colX, startY + 28, 280, 36, 'description'),
    el(price, colX + 200, startY + 30, 52, 22, 'price'),
  ];
}

describe('Menu spatial layout engine', () => {
  it('Test A — 1 column', () => {
    const page = buildTestPage(
      [
        el('LANCHES', 100, 80, 200, 28, 'category'),
        ...productBlock('01', 'X-Burger', 'Pão, carne e queijo', '25,90', 100, 130),
        ...productBlock('02', 'X-Bacon', 'Com bacon crocante', '29,90', 100, 220),
      ],
      600,
      900,
    );

    const result = parseSpatialLayout(page);
    assert.equal(result.columnCount, 1);
    assert.equal(result.products.length, 2);
    assert.match(result.products[0].sectionName, /Lanches/i);
    assert.equal(result.products[0].price, 25.9);
  });

  it('Test B — 2 columns', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('SOBREMESAS', 520, 100, 200, 28, 'category'),
        ...productBlock('01', 'Fritas', 'Batata palito crocante', '22,90', 80, 150),
        ...productBlock('01', 'Brigadeiro', 'Feito aqui', '12,90', 520, 150),
      ],
      1000,
      1200,
    );

    const result = parseSpatialLayout(page);
    assert.equal(detectColumnCount(page.elements.filter((e) => e.type === 'category' || e.type === 'product'), page.width), 2);
    assert.equal(result.columnCount, 2);

    const entradas = result.products.filter((p) => p.sectionName === 'Entradas');
    const sobremesas = result.products.filter((p) => p.sectionName === 'Sobremesas');
    assert.equal(entradas.length, 1);
    assert.equal(sobremesas.length, 1);
    assert.match(entradas[0].name, /Fritas/i);
    assert.match(sobremesas[0].name, /Brigadeiro/i);
  });

  it('Test C — 3 columns', () => {
    const page = buildTestPage(
      [
        el('PIZZAS', 40, 80, 120, 24, 'category'),
        el('BEBIDAS', 340, 80, 120, 24, 'category'),
        el('SOBREMESAS', 640, 80, 120, 24, 'category'),
        ...productBlock('01', 'Margherita', 'Molho e mussarela', '45,00', 40, 120),
        ...productBlock('01', 'Coca-Cola', 'Lata 350ml', '6,00', 340, 120),
        ...productBlock('01', 'Pudim', 'Caseiro', '10,00', 640, 120),
      ],
      960,
      800,
    );

    const result = parseSpatialLayout(page);
    assert.equal(result.products.length, 3);
    assert.ok(result.columnCount >= 2);
  });

  it('Test D — 2 columns with categories on same horizontal line', () => {
    const items: ReturnType<typeof el>[] = [
      el('ENTRADAS', 80, 100, 200, 28, 'category'),
      el('SOBREMESAS', 520, 100, 200, 28, 'category'),
    ];

    const leftProducts = ['Fritas', 'Dadinho', 'Torresmo', 'Saladinha'];
    const rightProducts = ['Brigadeiro', 'Merengue', 'Pudim', 'Frutas da estação'];

    leftProducts.forEach((name, i) => {
      items.push(...productBlock(String(i + 1).padStart(2, '0'), name, `Descrição ${name}`, `${20 + i},90`, 80, 150 + i * 90));
    });
    rightProducts.forEach((name, i) => {
      items.push(...productBlock(String(i + 1).padStart(2, '0'), name, `Descrição ${name}`, `${15 + i},90`, 520, 150 + i * 90));
    });

    const page = buildTestPage(items, 1000, 1400);
    const draft = spatialResultToDraft(parseSpatialLayout(page));

    const entradas = draft.categories.find((c) => c.name === 'Entradas');
    const sobremesas = draft.categories.find((c) => c.name === 'Sobremesas');

    assert.ok(entradas);
    assert.ok(sobremesas);
    assert.equal(entradas!.products.length, 4);
    assert.equal(sobremesas!.products.length, 4);
    assert.ok(entradas!.products.every((p) => !p.name.includes('Brigadeiro')));
    assert.ok(sobremesas!.products.every((p) => !p.name.includes('Fritas')));
  });

  it('Test E — categories with different product counts', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        ...productBlock('01', 'Fritas', 'Desc', '22,90', 80, 150),
        ...productBlock('02', 'Torresmo', 'Desc', '14,90', 80, 240),
        el('BEBIDAS', 520, 100, 200, 28, 'category'),
        ...productBlock('01', 'Água', 'Sem gás', '5,00', 520, 150),
      ],
      1000,
      900,
    );

    const draft = spatialResultToDraft(parseSpatialLayout(page));
    assert.equal(draft.categories.find((c) => c.name === 'Entradas')?.products.length, 2);
    assert.equal(draft.categories.find((c) => c.name === 'Bebidas')?.products.length, 1);
  });

  it('Test F — prices positioned to the right', () => {
    const page = buildTestPage(
      [
        el('PRATOS', 100, 80, 200, 28, 'category'),
        el('01 - Bife à cavalo', 100, 130, 260, 22, 'product'),
        el('Filé grelhado com arroz e ovo', 100, 158, 300, 30, 'description'),
        el('58,90', 420, 140, 55, 22, 'price'),
      ],
      600,
      500,
    );

    const product = parseSpatialLayout(page).products[0];
    assert.equal(product.price, 58.9);
    assert.match(product.name, /Bife/i);
  });

  it('Test G — image gap between products does not merge sections', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        ...productBlock('01', 'Fritas', 'Desc A', '22,90', 80, 150),
        ...productBlock('02', 'Torresmo', 'Desc B', '14,90', 80, 550),
      ],
      600,
      900,
    );

    const draft = spatialResultToDraft(parseSpatialLayout(page));
    assert.equal(draft.categories[0]?.products.length, 2);
  });

  it('Test H — 2x2 grid (reference layout structure)', () => {
    const items: ReturnType<typeof el>[] = [
      el('ENTRADAS', 80, 120, 220, 30, 'category'),
      el('SOBREMESAS', 520, 120, 220, 30, 'category'),
    ];

    const leftTop = ['Fritas', 'Dadinho de tapioca', 'Torresmo', 'Saladinha'];
    const rightTop = ['Brigadeiro de colher', 'Merengue', 'Pudim', 'Frutas da estação'];
    const leftBottom = ['Bife à cavalo', 'Frango grelhado', 'Peixe frito', 'Feijoada'];
    const rightBottom = ['Refrigerante', 'Água', 'Cerveja', 'Vinho da casa'];

    leftTop.forEach((n, i) =>
      items.push(...productBlock(String(i + 1).padStart(2, '0'), n, `Desc ${n}`, `${20 + i},90`, 80, 170 + i * 85)),
    );
    rightTop.forEach((n, i) =>
      items.push(...productBlock(String(i + 1).padStart(2, '0'), n, `Desc ${n}`, `${15 + i},90`, 520, 170 + i * 85)),
    );

    items.push(el('PRATOS PRINCIPAIS', 80, 620, 260, 30, 'category'));
    items.push(el('BEBIDAS', 520, 620, 200, 30, 'category'));

    leftBottom.forEach((n, i) =>
      items.push(...productBlock(String(i + 1).padStart(2, '0'), n, `Desc ${n}`, `${35 + i},90`, 80, 670 + i * 85)),
    );
    rightBottom.forEach((n, i) =>
      items.push(...productBlock(String(i + 1).padStart(2, '0'), n, `Desc ${n}`, `${5 + i},90`, 520, 670 + i * 85)),
    );

    const page = buildTestPage(items, 1000, 1100);
    const draft = spatialResultToDraft(parseSpatialLayout(page));

    assert.equal(draft.categories.length, 4);
    for (const name of ['Entradas', 'Sobremesas', 'Pratos principais', 'Bebidas']) {
      const cat = draft.categories.find((c) => c.name === name);
      assert.ok(cat, `missing category ${name}`);
      assert.equal(cat!.products.length, 4, `${name} should have 4 products`);
    }
  });

  it('Test I — description lines are not product names', () => {
    const page = buildTestPage(
      [
        el('ENTRADAS', 80, 100, 200, 28, 'category'),
        el('01 - Bife à cavalo', 80, 150, 260, 22, 'other'),
        el('bife grelhado, arroz, feijão, farofa e ovo.', 80, 178, 300, 30, 'other'),
        el('58,90', 420, 155, 55, 22, 'price'),
        el('02 - Feijoada', 80, 240, 220, 22, 'other'),
        el('feijoada completa (ou não)!', 80, 268, 280, 30, 'other'),
        el('45,00', 420, 245, 55, 22, 'price'),
      ],
      600,
      500,
    );

    const result = parseSpatialLayout(page);
    assert.equal(result.products.length, 2);
    assert.match(result.products[0].name, /Bife/i);
    assert.ok(
      result.products[0].descriptionElements.some((d) => /feijão/i.test(d.text)),
      'ingredients should be description',
    );
    assert.equal(result.products[0].price, 58.9);
    assert.match(result.products[1].name, /Feijoada/i);
    assert.equal(result.products[1].price, 45);
  });

  it('Test J — misclassified description merges into previous product', () => {
    const page = buildTestPage(
      [
        el('PRATOS PRINCIPAIS', 80, 100, 240, 28, 'category'),
        el('01 - Bife à cavalo', 80, 150, 260, 22, 'product'),
        el('feijão, farofa e ovo.', 80, 178, 280, 30, 'product'),
        el('58,90', 420, 155, 55, 22, 'price'),
      ],
      600,
      500,
    );

    const product = parseSpatialLayout(page).products[0];
    assert.match(product.name, /Bife/i);
    assert.ok(product.descriptionElements.length >= 1);
    assert.match(product.descriptionElements[0].text, /feijão/i);
  });
});
