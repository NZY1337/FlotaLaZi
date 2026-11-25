import { mapLegacyBackup } from './legacy-mapper';
import { TrailerType, VehicleKind } from '../vehicles/entities/vehicle.entity';
import { TransactionType } from '../transactions/entities/transaction.entity';

const backup = {
    settings: { eurRate: 4.98, oilAlertKm: 4000, docAlertDays: 20 },
    trucks: [
        { id: 'tk1', plate: 'nt 08 rgt', name: 'Scania R500', vin: 'ys2r4x', trailerId: 'tr1', km: 412000, lastOilKm: 380000, intervalKm: 50000, lastOilDate: '2026-06-01', intervalMonths: 12 },
        { id: 'tk2', plate: 'NT 09 ABC', trailerId: 'tr1' },
        { id: 'bad' },
    ],
    trailers: [{ id: 'tr1', plate: 'NT 83 SAT', kind: 'Remorcă', rcaDate: '2026-12-01', itpDate: 'not-a-date', alertDays: 15 }],
    docs: [
        { id: 'd1', vehicleId: 'tk1', type: 'Rovinietă', expiry: '2027-01-10', alertDays: 10 },
        { id: 'd2', vehicleId: 'general', type: 'Licență Transport', expiry: '2030-05-05' },
        { id: 'd3', vehicleId: 'tk1', type: 'ITP', expiry: '2026-02-30' },
    ],
    txs: [
        { id: 'x1', type: 'income', date: '2026-11-02', amount: 1500, currency: 'EUR', category: 'Transport / Cursă', vehicleId: 'tk1', desc: 'Cursă DE' },
        { id: 'x2', type: 'expense', date: '2026-11-03', amount: 812.4, currency: 'RON', category: 'Combustibil', vehicleId: 'tk1', liters: 120 },
        { id: 'x3', type: 'expense', date: '2026-11-03', amount: -5, currency: 'RON' },
        { id: 'x4', type: 'expense', date: '2026-11-03', amount: 5, currency: 'USD' },
    ],
};

describe('mapLegacyBackup', () => {
    const plan = mapLegacyBackup(backup);

    it('maps settings', () => {
        expect(plan.settings).toEqual({ eurRate: 4.98, oilAlertKm: 4000, docAlertDays: 20 });
    });

    it('maps trucks and trailers, uppercasing plates and coupling each trailer once', () => {
        const trailer = plan.vehicles.find((v) => v.kind === VehicleKind.TRAILER)!;
        const [truck1, truck2] = plan.vehicles.filter((v) => v.kind === VehicleKind.TRUCK);
        expect(trailer).toMatchObject({ plate: 'NT 83 SAT', trailerType: TrailerType.REMORCA });
        expect(truck1).toMatchObject({ plate: 'NT 08 RGT', vin: 'YS2R4X', attachedTrailerId: trailer.id, km: 412000, oilIntervalKm: 50000, lastOilDate: '2026-06-01' });
        expect(truck2).toMatchObject({ attachedTrailerId: null, oilIntervalKm: 50000, oilIntervalMonths: 12 });
    });

    it('turns trailer RCA/ITP dates into documents and keeps only valid documents', () => {
        const trailer = plan.vehicles.find((v) => v.kind === VehicleKind.TRAILER)!;
        const truck1 = plan.vehicles.find((v) => v.plate === 'NT 08 RGT')!;
        expect(plan.documents).toEqual([
            { vehicleId: trailer.id, type: 'Asigurare RCA', expiresOn: '2026-12-01', alertDays: 15, notes: '' },
            { vehicleId: truck1.id, type: 'Rovinietă', expiresOn: '2027-01-10', alertDays: 10, notes: '' },
            { vehicleId: null, type: 'Licență Transport', expiresOn: '2030-05-05', alertDays: 20, notes: '' },
        ]);
    });

    it('converts transactions to minor units at the backup rate', () => {
        const truck1 = plan.vehicles.find((v) => v.plate === 'NT 08 RGT')!;
        expect(plan.transactions).toEqual([
            { type: TransactionType.INCOME, date: '2026-11-02', amount: 150000, currency: 'EUR', eurRate: 4.98, amountRon: 747000, category: 'Transport / Cursă', vehicleId: truck1.id, liters: null, notes: 'Cursă DE' },
            { type: TransactionType.EXPENSE, date: '2026-11-03', amount: 81240, currency: 'RON', eurRate: 4.98, amountRon: 81240, category: 'Combustibil', vehicleId: truck1.id, liters: 120, notes: '' },
        ]);
    });

    it('counts what it skipped', () => {
        // truck "bad", doc d3 (30 Feb), tx x3 (negative), tx x4 (USD)
        expect(plan.skipped).toBe(4);
    });

    it('treats garbage input as an empty backup', () => {
        expect(mapLegacyBackup('nope')).toEqual({ settings: {}, vehicles: [], documents: [], transactions: [], skipped: 0 });
    });
});
