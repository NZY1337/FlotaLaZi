import { addDays, addMonths, daysBetween, isYmd, monthRange, todayYmd } from './dates';
import { decimalToMinor, MAX_AMOUNT, MAX_EUR_RATE, toRonMinor } from './money';
import { expiryStatus, oilStatus, shouldAlertDocument, shouldAlertOil } from './status';

describe('dates', () => {
    it('validates real calendar dates only', () => {
        expect(isYmd('2026-02-28')).toBe(true);
        expect(isYmd('2026-02-30')).toBe(false);
        expect(isYmd('2026-2-01')).toBe(false);
        expect(isYmd(20260101)).toBe(false);
    });

    it('rejects years outside 2000-2099 (typos like 202788 or 0202)', () => {
        expect(isYmd('2000-01-01')).toBe(true);
        expect(isYmd('2099-12-31')).toBe(true);
        expect(isYmd('1999-12-31')).toBe(false);
        expect(isYmd('0202-05-01')).toBe(false);
        expect(isYmd('202788-05-01')).toBe(false);
    });

    it('computes today in Bucharest, not UTC', () => {
        // 22:30 UTC on 31 Dec is already 1 Jan in Romania (UTC+2).
        expect(todayYmd(new Date('2026-12-31T22:30:00Z'))).toBe('2027-01-01');
    });

    it('counts days across a DST change without drifting', () => {
        expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
        expect(daysBetween('2026-03-30', '2026-03-28')).toBe(-2);
        expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    });

    it('clamps month arithmetic to the last day of the month', () => {
        expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
        expect(addMonths('2027-11-30', 3)).toBe('2028-02-29');
        expect(addMonths('2026-05-15', 12)).toBe('2027-05-15');
    });

    it('returns the month range', () => {
        expect(monthRange('2026-02-14')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    });
});

describe('money', () => {
    it('converts EUR to RON at the captured rate, rounding to bani', () => {
        expect(toRonMinor(10000, 'EUR', 4.9765)).toBe(49765);
        expect(toRonMinor(333, 'EUR', 4.98)).toBe(1658);
        expect(toRonMinor(12345, 'RON', 4.98)).toBe(12345);
    });

    it('rounds exact halves up, where float math would round them down', () => {
        // 130.00 EUR × 4.9765 = 646.945 RON exactly; as floats it is 64694.49999…
        expect(toRonMinor(13000, 'EUR', 4.9765)).toBe(64695);
        expect(toRonMinor(3000, 'EUR', 4.9815)).toBe(14945);
        expect(toRonMinor(1, 'EUR', 4.5)).toBe(5);       // 4.5 bani → 5
        expect(toRonMinor(1, 'EUR', 4.4999)).toBe(4);
    });

    it('keeps the largest allowed amount inside a Postgres int', () => {
        expect(toRonMinor(MAX_AMOUNT * 100, 'EUR', MAX_EUR_RATE)).toBeLessThanOrEqual(2_147_483_647);
    });

    it('converts decimals to minor units without float noise', () => {
        expect(decimalToMinor(19.99)).toBe(1999);
        expect(decimalToMinor(0.1 + 0.2)).toBe(30);
    });
});

describe('expiryStatus', () => {
    const today = '2026-11-25';
    it('is red when expired or expiring today', () => {
        expect(expiryStatus('2026-11-25', 30, today)).toEqual({ daysLeft: 0, level: 'red' });
        expect(expiryStatus('2026-11-20', 30, today)).toEqual({ daysLeft: -5, level: 'red' });
    });
    it('is yellow inside the alert window and green outside', () => {
        expect(expiryStatus('2026-12-25', 30, today).level).toBe('yellow');
        expect(expiryStatus('2026-12-26', 30, today).level).toBe('green');
    });
});

describe('oilStatus', () => {
    const base = { km: 100_000, lastOilKm: 60_000, oilIntervalKm: 50_000, lastOilDate: null, oilIntervalMonths: null };

    it('is green with plenty of km left', () => {
        const s = oilStatus(base, 5000, '2026-11-25');
        expect(s).toMatchObject({ configured: true, nextKm: 110_000, kmLeft: 10_000, level: 'green', usedPct: 80 });
    });

    it('is yellow within the km warning and red when overdue', () => {
        expect(oilStatus({ ...base, km: 106_000 }, 5000, '2026-11-25').level).toBe('yellow');
        expect(oilStatus({ ...base, km: 110_000 }, 5000, '2026-11-25').level).toBe('red');
    });

    it('turns red when the months interval has passed even with km left', () => {
        const s = oilStatus({ ...base, lastOilDate: '2025-11-01', oilIntervalMonths: 12 }, 5000, '2026-11-25');
        expect(s).toMatchObject({ dueDate: '2026-11-01', daysLeft: -24, level: 'red' });
    });

    it('is yellow within 30 days of the date limit', () => {
        const s = oilStatus({ ...base, lastOilDate: '2025-12-10', oilIntervalMonths: 12 }, 5000, '2026-11-25');
        expect(s.level).toBe('yellow');
    });

    it('reports not configured when nothing is filled in', () => {
        const s = oilStatus({ km: null, lastOilKm: null, oilIntervalKm: null, lastOilDate: null, oilIntervalMonths: null }, 5000, '2026-11-25');
        expect(s).toMatchObject({ configured: false, level: 'green' });
    });
});

describe('reminder rules', () => {
    const today = '2026-11-25';
    it('alerts documents only on threshold days, once per day', () => {
        expect(shouldAlertDocument(30, 30, null, today)).toBe(true);
        expect(shouldAlertDocument(7, 30, null, today)).toBe(true);
        expect(shouldAlertDocument(1, 30, null, today)).toBe(true);
        expect(shouldAlertDocument(0, 30, null, today)).toBe(true);
        expect(shouldAlertDocument(-1, 30, null, today)).toBe(true);
        expect(shouldAlertDocument(12, 30, null, today)).toBe(false);
        expect(shouldAlertDocument(-5, 30, null, today)).toBe(false);
        expect(shouldAlertDocument(7, 30, today, today)).toBe(false);
    });

    it('alerts oil at most weekly while not green', () => {
        expect(shouldAlertOil('green', null, today)).toBe(false);
        expect(shouldAlertOil('yellow', null, today)).toBe(true);
        expect(shouldAlertOil('red', '2026-11-20', today)).toBe(false);
        expect(shouldAlertOil('red', '2026-11-18', today)).toBe(true);
    });
});
