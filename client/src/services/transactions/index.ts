import { apiFetch, jsonBody, query } from '../api';

export type Currency = 'RON' | 'EUR';
export type TransactionType = 'INCOME' | 'EXPENSE';

export type Transaction = {
    id: string;
    type: TransactionType;
    date: string;
    amount: number;       // minor units, in `currency`
    currency: Currency;
    eurRate: number;
    amountRon: number;    // minor units, computed by the backend
    category: string;
    vehicleId: string | null;
    liters: number | null;
    notes: string;
};

export type TransactionInput = {
    type?: TransactionType;
    date?: string;
    amount?: number;      // major units (e.g. 1250.5)
    currency?: Currency;
    category?: string;
    vehicleId?: string | null;
    liters?: number | null;
    notes?: string;
};

export type TransactionFilters = { from?: string; to?: string; vehicleId?: string; type?: TransactionType };

type Totals = { income: number; expense: number; profit: number };

export type Summary = {
    totals: Totals & { byCurrency: Record<Currency, { income: number; expense: number }> };
    byCategory: { category: string; expense: number }[];
    byVehicle: ({ vehicleId: string | null } & Totals)[];
    byMonth: ({ month: string } & Totals)[];
};

export const getTransactions = (token: string, filters: TransactionFilters = {}) =>
    apiFetch<Transaction[]>(token, `/transactions${query(filters)}`);

export const getSummary = (token: string, filters: Omit<TransactionFilters, 'type'> = {}) =>
    apiFetch<Summary>(token, `/transactions/summary${query(filters)}`);

export const createTransaction = (token: string, input: TransactionInput) =>
    apiFetch<Transaction>(token, '/transactions', { method: 'POST', ...jsonBody(input) });

export const updateTransaction = (token: string, id: string, input: TransactionInput) =>
    apiFetch<Transaction>(token, `/transactions/${encodeURIComponent(id)}`, { method: 'PATCH', ...jsonBody(input) });

export const deleteTransaction = (token: string, id: string) =>
    apiFetch<null>(token, `/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
