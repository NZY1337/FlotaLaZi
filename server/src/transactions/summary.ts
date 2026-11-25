import { TransactionType } from './entities/transaction.entity';

// Pure aggregation over already-filtered rows. All totals are RON minor units.

export type SummaryRow = {
    type: TransactionType;
    date: string;
    amount: number;
    currency: 'RON' | 'EUR';
    amountRon: number;
    category: string;
    vehicleId: string | null;
};

type Totals = { income: number; expense: number; profit: number };

export type Summary = {
    totals: Totals & {
        /** Native-currency totals, for "x RON + y EUR" display. */
        byCurrency: Record<'RON' | 'EUR', { income: number; expense: number }>;
    };
    byCategory: { category: string; expense: number }[];
    byVehicle: ({ vehicleId: string | null } & Totals)[];
    byMonth: ({ month: string } & Totals)[];
};

const totals = (income: number, expense: number): Totals => ({ income, expense, profit: income - expense });

export function summarize(rows: SummaryRow[]): Summary {
    let income = 0;
    let expense = 0;
    const byCurrency = { RON: { income: 0, expense: 0 }, EUR: { income: 0, expense: 0 } };
    const categories = new Map<string, number>();
    const vehicles = new Map<string | null, { income: number; expense: number }>();
    const months = new Map<string, { income: number; expense: number }>();

    for (const r of rows) {
        const isIncome = r.type === TransactionType.INCOME;
        const key = isIncome ? 'income' : 'expense';
        if (isIncome) income += r.amountRon;
        else expense += r.amountRon;
        byCurrency[r.currency][key] += r.amount;

        if (!isIncome) categories.set(r.category, (categories.get(r.category) ?? 0) + r.amountRon);

        const v = vehicles.get(r.vehicleId) ?? { income: 0, expense: 0 };
        v[key] += r.amountRon;
        vehicles.set(r.vehicleId, v);

        const month = r.date.slice(0, 7);
        const m = months.get(month) ?? { income: 0, expense: 0 };
        m[key] += r.amountRon;
        months.set(month, m);
    }

    return {
        totals: { ...totals(income, expense), byCurrency },
        byCategory: [...categories.entries()]
            .map(([category, value]) => ({ category, expense: value }))
            .sort((a, b) => b.expense - a.expense),
        byVehicle: [...vehicles.entries()]
            .map(([vehicleId, v]) => ({ vehicleId, ...totals(v.income, v.expense) }))
            .sort((a, b) => b.profit - a.profit),
        byMonth: [...months.entries()]
            .map(([month, m]) => ({ month, ...totals(m.income, m.expense) }))
            .sort((a, b) => a.month.localeCompare(b.month)),
    };
}
