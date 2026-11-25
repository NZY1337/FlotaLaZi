import { addMonths, daysBetween } from './dates';

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

/** Reminder thresholds for documents: alertDays, 7, 1, 0 (today) and −1 (just expired). */
export function isDocumentAlertDay(daysLeft: number, alertDays: number): boolean {
    return daysLeft === alertDays || daysLeft === 7 || daysLeft === 1 || daysLeft === 0 || daysLeft === -1;
}

export function shouldAlertDocument(daysLeft: number, alertDays: number, lastAlertedOn: string | null, today: string): boolean {
    return isDocumentAlertDay(daysLeft, alertDays) && lastAlertedOn !== today;
}

const OIL_ALERT_EVERY_DAYS = 7;

export function shouldAlertOil(level: Level, lastOilAlertOn: string | null, today: string): boolean {
    if (level === 'green') return false;
    return !lastOilAlertOn || daysBetween(lastOilAlertOn, today) >= OIL_ALERT_EVERY_DAYS;
}
