// Money is stored as integers in minor units (bani / euro cents).

export type Currency = 'RON' | 'EUR';
export const CURRENCIES: Currency[] = ['RON', 'EUR'];

/** Converts an amount in `currency` (minor units) to RON minor units. */
export function toRonMinor(amountMinor: number, currency: Currency, eurRate: number): number {
    return currency === 'EUR' ? Math.round(amountMinor * eurRate) : amountMinor;
}

/** Converts a decimal amount ("12.5") to minor units (1250). */
export function decimalToMinor(amount: number): number {
    return Math.round(amount * 100);
}
