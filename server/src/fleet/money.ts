// Money is stored as integers in minor units (bani / euro cents).

export type Currency = 'RON' | 'EUR';
export const CURRENCIES: Currency[] = ['RON', 'EUR'];

// Amounts are stored in Postgres `int` columns (max 2,147,483,647 minor units
// = 21,474,836.47). The largest amountRon is MAX_AMOUNT EUR at MAX_EUR_RATE:
// 1,000,000 × 20 = 20,000,000 RON, which fits. Raise either limit only with a
// migration to `bigint`.
export const MAX_AMOUNT = 1_000_000;  // major units, per transaction
export const MAX_EUR_RATE = 20;       // RON per 1 EUR

/**
 * Converts an amount in `currency` (minor units) to RON minor units, rounding
 * half up. Exact integer math: the rate has at most 4 decimals, so
 * amount × rate×10⁴ is an integer, and no float error can tip a .5 the wrong way.
 */
export function toRonMinor(amountMinor: number, currency: Currency, eurRate: number): number {
    if (currency !== 'EUR') return amountMinor;
    const rate10k = Math.round(eurRate * 10_000);
    return Math.floor((amountMinor * rate10k + 5_000) / 10_000);
}

/** Converts a decimal amount ("12.5") to minor units (1250). */
export function decimalToMinor(amount: number): number {
    return Math.round(amount * 100);
}
