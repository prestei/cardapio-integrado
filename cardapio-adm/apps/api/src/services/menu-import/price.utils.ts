/** Parse Brazilian currency strings into decimal numbers. Returns null if not parseable. */
export function parseBrazilianPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /(?:R\s*\$?\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:,\d{1,2})|\d+(?:\.\d{1,2}))/i,
  );
  if (!match) return null;

  let value = match[1];
  if (value.includes(',')) {
    value = value.replace(/\./g, '').replace(',', '.');
  }

  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

/** OCR often reads R$ as As, RS, Ass, etc. */
export function parseOcrPriceToken(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const standard = parseBrazilianPrice(trimmed);
  if (standard != null) return standard;

  const compact = trimmed.match(
    /^[RrAaSs\$]+[iI]?[oO]?[sS]?[\$]?\s*(\d{1,3})(?:,\d{2})?$/i,
  );
  if (compact) {
    const num = Number.parseInt(compact[1], 10);
    if (Number.isFinite(num) && num >= 1 && num <= 99) return num;
  }

  if (/^A[sS][iI1l][oO0]$/i.test(trimmed)) return 10;
  if (/^A[sS][sg]$/i.test(trimmed)) return 9;
  if (/^A[sS]{1,2}$/i.test(trimmed)) return 9;

  const rsPrice = trimmed.match(/^R[sS][iI1l]?(\d{1,2})$/i);
  if (rsPrice) {
    const digits = rsPrice[1];
    const num = digits.length === 1 ? Number.parseInt(`1${digits}`, 10) : Number.parseInt(digits, 10);
    if (num >= 1 && num <= 99) return num;
  }

  const trailing = trimmed.match(/[RrAaSs\$]{1,4}[iI]?[oO0]?(\d{1,3})$/i);
  if (trailing) {
    let numStr = trailing[1];
    if (/[oO]$/.test(trimmed) && numStr.length === 1) {
      numStr = `${numStr}0`;
    }
    const num = Number.parseInt(numStr, 10);
    if (Number.isFinite(num) && num >= 1 && num <= 99) return num;
  }

  if (/^\d{2,3}$/.test(trimmed)) {
    const num = Number.parseInt(trimmed, 10);
    if (num >= 1 && num <= 99) return num;
  }

  return null;
}

export function extractPriceFromLine(line: string): { price: number | null; rest: string } {
  const trimmed = line.trim();

  const endDecimal = trimmed.match(/^(.+?)\s+(\d{1,3},\d{2})\s*$/);
  if (endDecimal) {
    const price = parseBrazilianPrice(endDecimal[2]);
    const rest = endDecimal[1].trim();
    if (price != null && rest.length >= 2) {
      return { price, rest };
    }
  }

  const endInteger = trimmed.match(/^(.+?)\s+R\s*\$?\s*(\d{1,3})(?:,\d{2})?\s*$/i);
  if (endInteger) {
    const price = Number.parseInt(endInteger[2], 10);
    const rest = endInteger[1].trim();
    if (Number.isFinite(price) && rest.length >= 2) {
      return { price, rest };
    }
  }

  const ocrEnd = trimmed.match(/^(.+?)\s+([RrAaSs\$][a-zA-Z\$]{0,3}(\d{1,3}))\s*$/);
  if (ocrEnd) {
    const price = parseOcrPriceToken(ocrEnd[2]);
    const rest = ocrEnd[1].trim();
    if (price != null && rest.length >= 2) {
      return { price, rest };
    }
  }

  const patterns = [
    /(?:^|\s)(R\s*\$?\s*\d{1,3}(?:\.\d{3})*,\d{2})(?:\s|$)/i,
    /(?:^|\s)(R\s*\$?\s*\d+(?:,\d{2})?)(?:\s|$)/i,
    /(?:^|\s)(\d{1,3}(?:\.\d{3})*,\d{2})(?:\s|$)/,
    /(?:^|\s)(\d+,\d{2})(?:\s|$)/,
    /(?:^|\s)([RrAaSs\$][a-zA-Z\$]{0,3}\d{1,3})(?:\s|$)/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const price = parseOcrPriceToken(match[1]) ?? parseBrazilianPrice(match[1]);
      const rest = trimmed.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
      if (price != null && rest.length >= 1) {
        return { price, rest };
      }
    }
  }

  return { price: null, rest: trimmed };
}

export function isLikelyPriceLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^R\s*\$?\s*\d/i.test(trimmed) ||
    /^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(trimmed) ||
    /^\d+,\d{2}$/.test(trimmed) ||
    /^[RrAaSs\$][a-zA-Z\$]{0,3}\d{1,3}$/.test(trimmed) ||
    /^\d{1,3}$/.test(trimmed)
  );
}

export function isStandalonePrice(line: string): boolean {
  const trimmed = line.trim();
  if (/^\d{1,3},\d{2}$/.test(trimmed) || /^\d{1,3}\.\d{3},\d{2}$/.test(trimmed)) {
    return true;
  }
  if (/^R\s*\$?\s*\d{1,3}(?:,\d{2})?$/i.test(trimmed)) return true;
  return parseOcrPriceToken(trimmed) != null && trimmed.length <= 8;
}
