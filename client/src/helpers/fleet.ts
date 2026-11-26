import { formatPrice } from './helpers';
import type { Level } from '../services/vehicles';
import type { Currency } from '../services/transactions';

// Presentation helpers only — statuses and totals come from the backend.

export const DOCUMENT_TYPES = [
    'ITP', 'Asigurare RCA', 'Asigurare CASCO', 'Rovinietă', 'Verificare Tahograf', 'Copie Conformă',
    'Licență Transport', 'Licență Comunitară', 'ADR', 'Asigurare CMR',
    'Impozit auto', 'Trusă medicală', 'Extinctor',
];

export const DRIVER_DOCUMENT_TYPES = [
    'Permis de conducere', 'Atestat profesional', 'Card tahograf', 'Aviz medical', 'Aviz psihologic', 'Cartelă / Card ADR',
];

export const EXPENSE_CATEGORIES = [
    { name: 'Combustibil', icon: '⛽' },
    { name: 'Taxe drum / Rovinietă', icon: '🛣️' },
    { name: 'Parcare / Cazare', icon: '🅿️' },
    { name: 'Mâncare', icon: '🍽️' },
    { name: 'Reparații', icon: '🔧' },
    { name: 'Piese / Anvelope', icon: '🛞' },
    { name: 'Schimb ulei', icon: '🛢️' },
    { name: 'Asigurări / Acte', icon: '📄' },
    { name: 'Salarii', icon: '👤' },
    { name: 'Altele', icon: '📦' },
];

export const INCOME_CATEGORIES = [
    { name: 'Transport / Cursă', icon: '🚚' },
    { name: 'Altele (venit)', icon: '💵' },
];

export const FUEL_CATEGORY = 'Combustibil';

const ICONS = new Map([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.name, c.icon]));
export const categoryIcon = (name: string) => ICONS.get(name) ?? '📦';

const MONTHS = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
export const MONTHS_LONG = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

export const money = (minor: number, currency: Currency = 'RON') => formatPrice(minor, currency);

export const formatDate = (ymd: string | null | undefined) => (ymd ? ymd.split('-').reverse().join('.') : '—');

export const formatKm = (km: number | null | undefined) => (km == null ? '—' : `${km.toLocaleString('ro-RO')} km`);

export const monthLabel = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-');
    return `${MONTHS[Number(m) - 1]} ${y}`;
};

const pad = (n: number) => String(n).padStart(2, '0');
export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Default value for date inputs (the backend owns "today" for statuses). */
export const todayInput = () => toYmd(new Date());

export const plusMonthsInput = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return toYmd(d);
};

export const daysLeftLabel = (daysLeft: number) => {
    if (daysLeft < 0) return `Expirat de ${-daysLeft} ${-daysLeft === 1 ? 'zi' : 'zile'}`;
    if (daysLeft === 0) return 'Expiră azi';
    if (daysLeft === 1) return 'Expiră mâine';
    return `Mai sunt ${daysLeft} zile`;
};

export const LEVEL_STYLES: Record<Level, { badge: string; border: string; bar: string }> = {
    red: {
        badge: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
        border: 'border-l-error-500',
        bar: 'bg-error-500',
    },
    yellow: {
        badge: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400',
        border: 'border-l-warning-500',
        bar: 'bg-warning-500',
    },
    green: {
        badge: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
        border: 'border-l-success-500',
        bar: 'bg-success-500',
    },
};

/**
 * Reads a number the way a Romanian types it. '.' groups thousands and ','
 * marks decimals ("1.500" = 1500, "1.500,50" = 1500.5), but many also type a
 * decimal point ("12.5"). So '.' followed by exactly three digits, in groups,
 * means thousands; any other single '.' or ',' means decimals. Anything else
 * ("1,500", "1.5.0", more decimals than allowed) is unclear: null, so the form
 * asks again instead of saving a wrong amount. "" is null too.
 */
export const parseNumberInput = (input: string, maxDecimals: number): number | null => {
    const value = input.trim().replace(/[\s\u00a0]/g, '');
    if (value === '') return null;
    let normalized: string;
    if (/^\d+$/.test(value)) {
        normalized = value;
    } else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(value)) {
        normalized = value.replace(/\./g, '').replace(',', '.');      // 1.500 / 1.500,50
    } else if (/^\d{1,3}(,\d{3})+\.\d+$/.test(value)) {
        normalized = value.replace(/,/g, '');                          // 1,500.50
    } else if (/^\d+[.,]\d+$/.test(value)) {
        normalized = value.replace(',', '.');                          // 12.5 / 12,5
    } else {
        return null;
    }
    const decimals = normalized.split('.')[1]?.length ?? 0;
    if (decimals > maxDecimals) return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
};

/** How a parsed number reads back in Romanian: 1500.5 → "1.500,50". */
export const formatNumberInput = (n: number, decimals: number) =>
    n.toLocaleString('ro-RO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** "azi", "ieri", "acum 5 zile", "acum 3 luni" for an ISO moment, by calendar days. */
export const sinceLabel = (iso: string, now: Date = new Date()) => {
    const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((day(now) - day(new Date(iso))) / 86_400_000);
    if (days <= 0) return 'azi';
    if (days === 1) return 'ieri';
    if (days < 60) return `acum ${days} zile`;
    return `acum ${Math.round(days / 30)} luni`;
};

/** "2026-11-26" → "26.11.2026", the way dates are written in Romania. */
export const formatDateInput = (ymd: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

/**
 * A date typed the Romanian way, day first: "26.11.2026", "26/11/2026",
 * "26-11-2026", "5.3.2026" or "26112026". Returns "YYYY-MM-DD", or null when
 * it is incomplete, not a real day (31.02) or outside 2000–2099 (the range the
 * server accepts). Only reads the input: the server still validates the date.
 */
export const parseDateInput = (input: string): string | null => {
    const text = input.trim();
    const m = /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/.exec(text) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(text);
    if (!m) return null;
    const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (year < 2000 || year > 2099 || month < 1 || month > 12 || day < 1) return null;
    if (day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * Adds the dots while the date is typed: "26" → "26.", "26.11" → "26.11.".
 * Only when a character was added, so backspace can still remove a dot.
 */
export const dotDateInput = (next: string, previous: string) => {
    const text = next.replace(/[/\-\s]/g, '.');
    if (text.length <= previous.length) return text;
    return /^\d{2}$|^\d{1,2}\.\d{2}$/.test(text) ? `${text}.` : text;
};
