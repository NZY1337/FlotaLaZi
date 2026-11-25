import { randomUUID } from 'crypto';
import { isYmd } from '../fleet/dates';
import { decimalToMinor, MAX_AMOUNT, MAX_EUR_RATE, toRonMinor, type Currency } from '../fleet/money';
import { TrailerType, VehicleKind } from '../vehicles/entities/vehicle.entity';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { DEFAULT_EUR_RATE } from '../settings/entities/fleet-settings.entity';

// Maps the single-file "Flota Mea" / EuroTrack localStorage backup (JSON) to
// rows for this backend. Pure: no DB access, ids are generated here so
// references (trailer coupling, document → vehicle) can be resolved up front.

type Raw = Record<string, unknown>;

const isObj = (x: unknown): x is Raw => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (v: unknown, max: number) => (v == null ? '' : String(v)).trim().slice(0, max);
const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
};
// A missing or non-numeric value is the fallback, never 0.
const int = (v: unknown, min: number, max: number, fallback: number | null) => {
    if (v == null || v === '') return fallback;
    const raw = typeof v === 'number' ? v : parseFloat(String(v));
    if (!Number.isFinite(raw)) return fallback;
    const n = Math.round(raw);
    return n >= min && n <= max ? n : fallback;
};
const list = (o: Raw, key: string): unknown[] => (Array.isArray(o[key]) ? (o[key] as unknown[]) : []);

export type LegacyPlan = {
    settings: { eurRate?: number; oilAlertKm?: number; docAlertDays?: number };
    vehicles: {
        id: string; kind: VehicleKind; plate: string; name: string; vin: string; notes: string;
        trailerType: TrailerType | null; attachedTrailerId: string | null;
        km: number | null; lastOilKm: number | null; oilIntervalKm: number | null;
        lastOilDate: string | null; oilIntervalMonths: number | null;
    }[];
    documents: { vehicleId: string | null; type: string; expiresOn: string; alertDays: number; notes: string }[];
    transactions: {
        type: TransactionType; date: string; amount: number; currency: Currency; eurRate: number;
        amountRon: number; category: string; vehicleId: string | null; liters: number | null; notes: string;
    }[];
    skipped: number;
};


export function mapLegacyBackup(input: unknown): LegacyPlan {
    const o = isObj(input) ? input : {};
    const s = isObj(o.settings) ? o.settings : {};
    const plan: LegacyPlan = { settings: {}, vehicles: [], documents: [], transactions: [], skipped: 0 };

    const eurRate = num(s.eurRate) > 0 && num(s.eurRate) <= MAX_EUR_RATE ? Math.round(num(s.eurRate) * 10_000) / 10_000 : null;
    if (eurRate) plan.settings.eurRate = eurRate;
    const oilAlertKm = int(s.oilAlertKm, 0, 100_000, null);
    if (oilAlertKm != null) plan.settings.oilAlertKm = oilAlertKm;
    const docAlertDays = int(s.docAlertDays, 1, 365, null);
    if (docAlertDays != null) plan.settings.docAlertDays = docAlertDays;
    const defaultAlertDays = docAlertDays ?? 30;

    const idMap = new Map<string, string>();
    const legacyId = (v: unknown) => (typeof v === 'string' && v ? v : null);

    for (const r of list(o, 'trailers')) {
        const plate = isObj(r) ? str(r.plate, 20).toUpperCase() : '';
        const oldId = isObj(r) ? legacyId(r.id) : null;
        if (!isObj(r) || !plate || !oldId) { plan.skipped++; continue; }
        const id = randomUUID();
        idMap.set(oldId, id);
        plan.vehicles.push({
            id, kind: VehicleKind.TRAILER, plate, name: str(r.name, 100), vin: str(r.vin, 17).toUpperCase(), notes: str(r.notes, 2000),
            trailerType: str(r.kind, 20) === 'Remorcă' ? TrailerType.REMORCA : TrailerType.SEMIREMORCA,
            attachedTrailerId: null, km: null, lastOilKm: null, oilIntervalKm: null, lastOilDate: null, oilIntervalMonths: null,
        });
        const alertDays = int(r.alertDays, 1, 365, defaultAlertDays)!;
        if (isYmd(r.rcaDate)) plan.documents.push({ vehicleId: id, type: 'Asigurare RCA', expiresOn: r.rcaDate, alertDays, notes: '' });
        if (isYmd(r.itpDate)) plan.documents.push({ vehicleId: id, type: 'ITP', expiresOn: r.itpDate, alertDays, notes: '' });
    }

    const coupled = new Set<string>();
    for (const t of list(o, 'trucks')) {
        const plate = isObj(t) ? str(t.plate, 20).toUpperCase() : '';
        const oldId = isObj(t) ? legacyId(t.id) : null;
        if (!isObj(t) || !plate || !oldId) { plan.skipped++; continue; }
        const id = randomUUID();
        idMap.set(oldId, id);
        const trailerOld = legacyId(t.trailerId);
        let attachedTrailerId = trailerOld ? idMap.get(trailerOld) ?? null : null;
        // A trailer can only be coupled once; later duplicates stay uncoupled.
        if (attachedTrailerId && coupled.has(attachedTrailerId)) attachedTrailerId = null;
        if (attachedTrailerId) coupled.add(attachedTrailerId);
        plan.vehicles.push({
            id, kind: VehicleKind.TRUCK, plate, name: str(t.name, 100), vin: str(t.vin, 17).toUpperCase(), notes: '',
            trailerType: null, attachedTrailerId,
            km: int(t.km, 0, 10_000_000, null),
            lastOilKm: int(t.lastOilKm, 0, 10_000_000, null),
            oilIntervalKm: int(t.intervalKm, 1000, 500_000, 50_000),
            lastOilDate: isYmd(t.lastOilDate) ? t.lastOilDate : null,
            oilIntervalMonths: int(t.intervalMonths, 1, 60, 12),
        });
    }

    const vehicleRef = (v: unknown) => {
        const old = legacyId(v);
        return old && old !== 'general' ? idMap.get(old) ?? null : null;
    };

    for (const d of list(o, 'docs')) {
        const type = isObj(d) ? str(d.type, 100) : '';
        if (!isObj(d) || !type || !isYmd(d.expiry)) { plan.skipped++; continue; }
        plan.documents.push({
            vehicleId: vehicleRef(d.vehicleId),
            type,
            expiresOn: d.expiry,
            alertDays: int(d.alertDays, 1, 365, defaultAlertDays)!,
            notes: str(d.notes, 500),
        });
    }

    const rate = eurRate ?? DEFAULT_EUR_RATE;
    for (const t of list(o, 'txs')) {
        const ok = isObj(t) && isYmd(t.date) && num(t.amount) > 0 && num(t.amount) <= MAX_AMOUNT
            && (t.type === 'income' || t.type === 'expense') && (t.currency === 'RON' || t.currency === 'EUR');
        if (!ok) { plan.skipped++; continue; }
        const currency = t.currency as Currency;
        const amount = decimalToMinor(num(t.amount));
        const liters = num(t.liters);
        plan.transactions.push({
            type: t.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
            date: t.date as string,
            amount,
            currency,
            eurRate: rate,
            amountRon: toRonMinor(amount, currency, rate),
            category: str(t.category, 60) || 'Altele',
            vehicleId: vehicleRef(t.vehicleId),
            liters: liters > 0 && liters <= 100_000 ? Math.round(liters * 100) / 100 : null,
            notes: str(t.desc, 500),
        });
    }

    return plan;
}
