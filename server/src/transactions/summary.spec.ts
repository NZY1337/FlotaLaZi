import { summarize, SummaryRow } from './summary';
import { TransactionType } from './entities/transaction.entity';

const row = (o: Partial<SummaryRow>): SummaryRow => ({
    type: TransactionType.EXPENSE, date: '2026-11-10', amount: 1000, currency: 'RON', amountRon: 1000,
    category: 'Combustibil', vehicleId: 'truck-1', ...o,
});

describe('summarize', () => {
    it('totals income, expense and profit in RON and keeps native-currency totals', () => {
        const s = summarize([
            row({ type: TransactionType.INCOME, amount: 100_000, currency: 'EUR', amountRon: 497_000, category: 'Transport / Cursă' }),
            row({ amount: 50_000, amountRon: 50_000 }),
            row({ amount: 10_000, currency: 'EUR', amountRon: 49_700, category: 'Taxe drum / Rovinietă' }),
        ]);
        expect(s.totals).toMatchObject({ income: 497_000, expense: 99_700, profit: 397_300 });
        expect(s.totals.byCurrency).toEqual({ RON: { income: 0, expense: 50_000 }, EUR: { income: 100_000, expense: 10_000 } });
    });

    it('groups expenses by category (largest first), by vehicle and by month', () => {
        const s = summarize([
            row({ amountRon: 100, category: 'Mâncare' }),
            row({ amountRon: 900, category: 'Combustibil', date: '2026-10-02' }),
            row({ amountRon: 300, category: 'Mâncare', vehicleId: null }),
            row({ type: TransactionType.INCOME, amountRon: 5000, category: 'Transport / Cursă' }),
        ]);
        expect(s.byCategory).toEqual([{ category: 'Combustibil', expense: 900 }, { category: 'Mâncare', expense: 400 }]);
        expect(s.byVehicle).toEqual([
            { vehicleId: 'truck-1', income: 5000, expense: 1000, profit: 4000 },
            { vehicleId: null, income: 0, expense: 300, profit: -300 },
        ]);
        expect(s.byMonth.map((m) => m.month)).toEqual(['2026-10', '2026-11']);
    });

    it('returns empty groups for no rows', () => {
        expect(summarize([])).toMatchObject({ totals: { income: 0, expense: 0, profit: 0 }, byCategory: [], byVehicle: [], byMonth: [] });
    });
});
