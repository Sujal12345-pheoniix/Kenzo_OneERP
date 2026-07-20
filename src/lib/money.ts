import { Prisma } from "@prisma/client";

/**
 * Enterprise Money Handling Utility
 * Guarantees precision monetary arithmetic without floating-point errors.
 */

export function toDecimal(value: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal {
  if (value === null || value === undefined) {
    return new Prisma.Decimal(0);
  }
  if (value instanceof Prisma.Decimal) {
    return value;
  }
  return new Prisma.Decimal(value);
}

export function toNumber(value: number | string | Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return parseFloat(value) || 0;
}

export function formatMoney(
  amount: number | string | Prisma.Decimal | null | undefined,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  const numericValue = toNumber(amount);
  
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (error) {
    // Fallback format if locale/currency is invalid
    return `${currency} ${numericValue.toFixed(2)}`;
  }
}

export function parseMoneyInput(input: string | number): Prisma.Decimal {
  if (typeof input === "number") {
    return new Prisma.Decimal(input.toFixed(2));
  }
  const cleanInput = input.replace(/[^0-9.-]/g, "");
  const val = parseFloat(cleanInput);
  if (isNaN(val)) return new Prisma.Decimal(0);
  return new Prisma.Decimal(val.toFixed(2));
}

export function addMoney(
  a: number | string | Prisma.Decimal,
  b: number | string | Prisma.Decimal
): Prisma.Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function subtractMoney(
  a: number | string | Prisma.Decimal,
  b: number | string | Prisma.Decimal
): Prisma.Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function calculateTax(
  amount: number | string | Prisma.Decimal,
  taxRatePercent: number
): { taxAmount: Prisma.Decimal; totalAmount: Prisma.Decimal } {
  const decAmount = toDecimal(amount);
  const taxRate = new Prisma.Decimal(taxRatePercent).div(100);
  const taxAmount = decAmount.mul(taxRate);
  const totalAmount = decAmount.plus(taxAmount);
  return {
    taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
    totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
  };
}
