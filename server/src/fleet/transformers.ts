import { ValueTransformer } from 'typeorm';

// Postgres `numeric` comes back as a string; these columns are small decimals
// (exchange rate, liters) where a JS number is precise enough.
export const numericTransformer: ValueTransformer = {
    to: (value: number | null | undefined) => value,
    from: (value: string | null) => (value == null ? null : Number(value)),
};
