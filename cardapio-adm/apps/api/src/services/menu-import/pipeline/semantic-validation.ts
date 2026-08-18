import type { ParsedMenu, SemanticCorrection, SemanticValidationResult } from './types.js';

/**
 * IA valida estrutura já montada espacialmente — NÃO reconstrói do zero.
 */
export async function validateMenuStructureWithAi(
  parsed: ParsedMenu,
): Promise<SemanticValidationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || parsed.categories.length === 0) {
    return { valid: true, corrections: [] };
  }

  const payload = {
    categories: parsed.categories.map((c) => ({
      name: c.name,
      columnIndex: c.columnIndex,
      products: c.products.map((p) => ({
        name: p.name,
        description: p.description ?? null,
        price: p.price ?? null,
      })),
    })),
  };

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
            content: `Você valida estruturas de cardápio já extraídas por visão computacional.
NÃO reconstrua o cardápio do zero.
NÃO invente produtos, preços ou categorias.
Apenas indique correções semânticas quando um campo claramente está errado (ex: descrição no campo nome).
Responda JSON: { "valid": boolean, "corrections": [{ "field": "category"|"product"|"description"|"price", "regionId": string?, "productIndex": number?, "from": string, "to": string, "reason": string? }] }`,
          },
          { role: 'user', content: JSON.stringify(payload).slice(0, 10000) },
        ],
      }),
    });

    if (!response.ok) return { valid: true, corrections: [] };

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { valid: true, corrections: [] };

    const parsedResponse = JSON.parse(content) as SemanticValidationResult;
    return {
      valid: parsedResponse.valid ?? true,
      corrections: Array.isArray(parsedResponse.corrections)
        ? parsedResponse.corrections
        : [],
    };
  } catch {
    return { valid: true, corrections: [] };
  }
}

export function applySemanticCorrections(
  parsed: ParsedMenu,
  corrections: SemanticCorrection[],
): ParsedMenu {
  if (corrections.length === 0) return parsed;

  const next = structuredClone(parsed);

  for (const fix of corrections) {
    if (fix.field === 'category' && fix.regionId) {
      const cat = next.categories.find((c) => c.regionId === fix.regionId);
      if (cat) cat.name = fix.to;
    }
    if (fix.field === 'product' && fix.regionId && fix.productIndex != null) {
      const cat = next.categories.find((c) => c.regionId === fix.regionId);
      const product = cat?.products[fix.productIndex];
      if (product) product.name = fix.to;
    }
    if (fix.field === 'description' && fix.regionId && fix.productIndex != null) {
      const cat = next.categories.find((c) => c.regionId === fix.regionId);
      const product = cat?.products[fix.productIndex];
      if (product) product.description = fix.to;
    }
    if (fix.field === 'price' && fix.regionId && fix.productIndex != null) {
      const cat = next.categories.find((c) => c.regionId === fix.regionId);
      const product = cat?.products[fix.productIndex];
      if (product) {
        const num = Number.parseFloat(fix.to.replace(',', '.'));
        if (Number.isFinite(num)) product.price = num;
      }
    }
  }

  return next;
}
