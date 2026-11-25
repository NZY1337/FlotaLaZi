// Calendar-date helpers. Business dates (expiry, transaction date, oil date)
// are plain `YYYY-MM-DD` strings — no time, no timezone. "Today" is always the
// calendar day in Romania, regardless of where the server runs.

export const BUSINESS_TIME_ZONE = 'Europe/Bucharest';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isYmd(value: unknown): value is string {
    if (typeof value !== 'string' || !YMD.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function todayYmd(now: Date = new Date()): string {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: BUSINESS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);
}

function toUtcMs(ymd: string): number {
    const [y, m, d] = ymd.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
    return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000);
}

export function addDays(ymd: string, days: number): string {
    return fromUtcMs(toUtcMs(ymd) + days * 86_400_000);
}

/** Adds calendar months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(ymd: string, months: number): string {
    const [y, m, d] = ymd.split('-').map(Number);
    const firstOfTarget = new Date(Date.UTC(y, m - 1 + months, 1));
    const lastDay = new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0)).getUTCDate();
    firstOfTarget.setUTCDate(Math.min(d, lastDay));
    return fromUtcMs(firstOfTarget.getTime());
}

/** First and last day of the month containing `ymd`. */
export function monthRange(ymd: string): { from: string; to: string } {
    const [y, m] = ymd.split('-').map(Number);
    const from = fromUtcMs(Date.UTC(y, m - 1, 1));
    const to = fromUtcMs(Date.UTC(y, m, 0));
    return { from, to };
}
