import { addDays, addMonths, daysBetween } from './dates';

// The single place where expiry / oil status is decided (CLAUDE.md §7).

export type Level = 'red' | 'yellow' | 'green';

export type ExpiryStatus = { daysLeft: number; level: Level };

export function expiryStatus(expiresOn: string, alertDays: number, today: string): ExpiryStatus {
    const daysLeft = daysBetween(today, expiresOn);
    const level: Level = daysLeft <= 0 ? 'red' : daysLeft <= alertDays ? 'yellow' : 'green';
    return { daysLeft, level };
}

export type OilInput = {
    km: number | null;
    lastOilKm: number | null;
    oilIntervalKm: number | null;
    lastOilDate: string | null;
    oilIntervalMonths: number | null;
};

export type OilStatus = {
    configured: boolean;
    nextKm: number | null;
    kmLeft: number | null;
    dueDate: string | null;
    daysLeft: number | null;
    /** 0–100, how much of the km interval is used. */
    usedPct: number;
    level: Level;
};

const OIL_SOON_DAYS = 30;

export function oilStatus(v: OilInput, oilAlertKm: number, today: string): OilStatus {
    const hasKm = v.km != null && v.lastOilKm != null && !!v.oilIntervalKm;
    const hasDate = !!v.lastOilDate && !!v.oilIntervalMonths;

    let level: Level = 'green';
    let nextKm: number | null = null;
    let kmLeft: number | null = null;
    let usedPct = 0;
    if (hasKm) {
        nextKm = v.lastOilKm! + v.oilIntervalKm!;
        kmLeft = nextKm - v.km!;
        usedPct = Math.max(0, Math.min(100, ((v.km! - v.lastOilKm!) / v.oilIntervalKm!) * 100));
        if (kmLeft <= 0) level = 'red';
        else if (kmLeft <= oilAlertKm) level = 'yellow';
    }

    let dueDate: string | null = null;
    let daysLeft: number | null = null;
    if (hasDate) {
        dueDate = addMonths(v.lastOilDate!, v.oilIntervalMonths!);
        daysLeft = daysBetween(today, dueDate);
        if (daysLeft < 0) level = 'red';
        else if (daysLeft <= OIL_SOON_DAYS && level === 'green') level = 'yellow';
    }

    return { configured: hasKm || hasDate, nextKm, kmLeft, dueDate, daysLeft, usedPct, level };
}

/** While a document stays expired, it is reminded again this often. */
/**
 * The odometer can't be behind the last oil change: a last change at more km
 * than the truck has is a typo. Returns the problem in Romanian, or null.
 */
export function odometerProblem(km: number | null | undefined, lastOilKm: number | null | undefined): string | null {
    if (km == null || lastOilKm == null || lastOilKm <= km) return null;
    return `Ultimul schimb de ulei (${lastOilKm} km) nu poate fi la mai mulți km decât kilometrajul actual (${km} km).`;
}

export const EXPIRED_REMINDER_EVERY_DAYS = 7;

/**
 * Whether the daily run should alert this document today (at most once a day):
 * - the first alert as soon as the document is inside its warning window
 *   (`alertDays` before expiry) — also when it was added or renewed late,
 *   so nobody waits for the next fixed day;
 * - then on the fixed days 7, 1, 0 (today) and −1 (just expired);
 * - then weekly while it stays expired, until the owner renews or deletes it.
 */
export function shouldAlertDocument(expiresOn: string, alertDays: number, lastAlertedOn: string | null, today: string): boolean {
    if (lastAlertedOn === today) return false;
    const daysLeft = daysBetween(today, expiresOn);
    if (daysLeft > alertDays) return false;
    const windowStart = addDays(expiresOn, -alertDays);
    if (lastAlertedOn === null || lastAlertedOn < windowStart) return true;
    if (daysLeft === 7 || daysLeft === 1 || daysLeft === 0 || daysLeft === -1) return true;
    return daysLeft < 0 && daysBetween(lastAlertedOn, today) >= EXPIRED_REMINDER_EVERY_DAYS;
}

const OIL_ALERT_EVERY_DAYS = 7;

export function shouldAlertOil(level: Level, lastOilAlertOn: string | null, today: string): boolean {
    if (level === 'green') return false;
    return !lastOilAlertOn || daysBetween(lastOilAlertOn, today) >= OIL_ALERT_EVERY_DAYS;
}
