import { Decimal } from '@prisma/client/runtime/library';

function isDecimal(value: unknown): value is Decimal {
  return Decimal.isDecimal(value);
}

export function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  return value.toNumber();
}

export function serialize<T>(data: T): T {
  if (data == null) {
    return data;
  }

  if (isDecimal(data)) {
    return data.toNumber() as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serialize(item)) as T;
  }

  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serialize(value);
    }
    return result as T;
  }

  return data;
}
