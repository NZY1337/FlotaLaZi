import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/ui/alert/Alert';
import { ActionButton, Card, EmptyState, PageHeader, Pills, SelectField } from '../../components/fleet/ui';
import StatCard from '../../components/fleet/StatCard';
import TransactionRow from '../../components/fleet/TransactionRow';
import TransactionFormModal from '../../components/fleet/TransactionFormModal';
import { useTransactionMutations, useTransactions, useTransactionSummary } from '../../hooks/useTransactions';
import { useVehicles } from '../../hooks/useVehicles';
import { MONTHS_LONG, categoryIcon, money, monthLabel, toYmd } from '../../helpers/fleet';
import { useTheme } from '../../context/ThemeContext';
import type { Transaction, TransactionType } from '../../services/transactions';

type Mode = 'month' | 'ytd' | 'year' | 'all';
type TypeFilter = 'all' | TransactionType;

const lastDay = (y: number, m: number) => toYmd(new Date(y, m + 1, 0));

/** The date range the user picked. Presentation only — totals come from the backend. */
function periodRange(mode: Mode, year: number, month: number): { from?: string; to?: string; label: string } {
    const now = new Date();
    if (mode === 'month') return { from: toYmd(new Date(year, month, 1)), to: lastDay(year, month), label: `${MONTHS_LONG[month]} ${year}` };
    if (mode === 'ytd') return { from: `${year}-01-01`, to: year === now.getFullYear() ? toYmd(now) : `${year}-12-31`, label: `1 ian – ${year === now.getFullYear() ? 'azi' : '31 dec'} ${year}` };
    if (mode === 'year') return { from: `${year}-01-01`, to: `${year}-12-31`, label: `Anul ${year}` };
    return { label: 'Tot istoricul' };
}

const csvCell = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function exportCsv(rows: Transaction[], plateOf: (id: string | null) => string) {
    const header = ['Data', 'Tip', 'Categorie', 'Vehicul', 'Suma', 'Moneda', 'Curs EUR', 'Suma RON', 'Litri', 'Descriere'];
    const lines = rows.map((t) => [
        t.date, t.type === 'INCOME' ? 'Încasare' : 'Cheltuială', t.category, plateOf(t.vehicleId),
        (t.amount / 100).toFixed(2), t.currency, t.eurRate, (t.amountRon / 100).toFixed(2), t.liters ?? '', t.notes,
    ].map(csvCell).join(';'));
    // BOM + ";" so Excel (RO locale) opens diacritics and columns correctly.
    const blob = new Blob(['﻿' + [header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eurotrack-tranzactii-${toYmd(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Finance() {
    const now = new Date();
    const [mode, setMode] = useState<Mode>('month');
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [vehicleId, setVehicleId] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [editing, setEditing] = useState<{ tx: Transaction | null; type: TransactionType } | null>(null);
    const { theme } = useTheme();

    const { vehicles } = useVehicles();
    const plates = useMemo(() => new Map(vehicles.map((v) => [v.id, v.plate])), [vehicles]);
    const plateOf = (id: string | null) => (id ? plates.get(id) ?? '—' : 'General');

    const range = periodRange(mode, year, month);
    const filters = { from: range.from, to: range.to, vehicleId: vehicleId || undefined };
    const { summary, isError } = useTransactionSummary(filters);
    const chartFilters = mode === 'all' ? { vehicleId: filters.vehicleId } : { from: `${year}-01-01`, to: `${year}-12-31`, vehicleId: filters.vehicleId };
    const { summary: chartSummary } = useTransactionSummary(chartFilters);
    const { transactions, isLoading } = useTransactions({ ...filters, type: typeFilter === 'all' ? undefined : typeFilter });
    const { remove } = useTransactionMutations();

    const step = (delta: number) => {
        if (mode === 'month') {
            const d = new Date(year, month + delta, 1);
            setYear(d.getFullYear());
            setMonth(d.getMonth());
        } else if (mode !== 'all') {
            setYear((y) => y + delta);
        }
    };

    const chartOptions: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Outfit, sans-serif', background: 'transparent',
            events: { dataPointSelection: (_e, _c, cfg) => {
                const m = chartSummary?.byMonth[cfg.dataPointIndex]?.month;
                if (m) { setMode('month'); setYear(Number(m.slice(0, 4))); setMonth(Number(m.slice(5, 7)) - 1); }
            } } },
        theme: { mode: theme === 'dark' ? 'dark' : 'light' },
        colors: ['#12b76a', '#f04438'],
        plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
        dataLabels: { enabled: false },
        xaxis: { categories: chartSummary?.byMonth.map((m) => monthLabel(m.month)) ?? [] },
        yaxis: { labels: { formatter: (v) => `${Math.round(v / 100).toLocaleString('ro-RO')}` } },
        tooltip: { y: { formatter: (v) => money(v) } },
        legend: { position: 'top' },
        grid: { borderColor: theme === 'dark' ? '#1f2937' : '#f2f4f7' },
    };
    const chartSeries = [
        { name: 'Încasări', data: chartSummary?.byMonth.map((m) => m.income) ?? [] },
        { name: 'Cheltuieli', data: chartSummary?.byMonth.map((m) => m.expense) ?? [] },
    ];

    const totals = summary?.totals;
    const maxCategory = Math.max(1, ...(summary?.byCategory.map((c) => c.expense) ?? [1]));

    const confirmDelete = (t: Transaction) => {
        if (window.confirm(`Ștergi ${t.category} din ${t.date}?`)) remove.mutate(t.id);
    };

    return (
        <>
            <PageMeta title="Financiar - EuroTrack" description="Încasări, cheltuieli și profit pe camion." />
            <PageHeader
                title="Financiar"
                subtitle="Profit pe lună și pe camion. Sumele în EUR sunt convertite la cursul din ziua înregistrării."
                actions={
                    <>
                        <ActionButton variant="success" onClick={() => setEditing({ tx: null, type: 'INCOME' })}>+ Încasare</ActionButton>
                        <ActionButton variant="danger" onClick={() => setEditing({ tx: null, type: 'EXPENSE' })}>+ Cheltuială</ActionButton>
                    </>
                }
            />

            <Card className="mb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Pills label="Perioadă" value={mode} onChange={setMode} options={[
                            { value: 'month', label: 'Pe lună' },
                            { value: 'ytd', label: '1 ian – azi' },
                            { value: 'year', label: 'Tot anul' },
                            { value: 'all', label: 'Tot istoricul' },
                        ]} />
                        <div className="flex items-center gap-3">
                            <ActionButton size="sm" variant="outline" onClick={() => step(-1)} disabled={mode === 'all'}>◀</ActionButton>
                            <span className="min-w-40 text-center text-sm font-semibold text-gray-800 dark:text-white/90">{range.label}</span>
                            <ActionButton size="sm" variant="outline" onClick={() => step(1)} disabled={mode === 'all'}>▶</ActionButton>
                        </div>
                    </div>
                    <div className="w-full lg:w-64">
                        <SelectField label="Vehicul" value={vehicleId} onChange={setVehicleId}
                            options={[{ value: '', label: 'Toate vehiculele' }, ...vehicles.map((v) => ({ value: v.id, label: `${v.kind === 'TRUCK' ? '🚛' : '🚚'} ${v.plate}` }))]} />
                    </div>
                </div>
            </Card>

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca datele financiare." />}

            {totals && (
                <div className="mb-4 grid gap-4 sm:grid-cols-3">
                    <StatCard label="Încasări (echiv. RON)" value={money(totals.income)} tone="green"
                        sub={`${money(totals.byCurrency.EUR.income, 'EUR')} + ${money(totals.byCurrency.RON.income)}`} />
                    <StatCard label="Cheltuieli (echiv. RON)" value={money(totals.expense)} tone="red"
                        sub={`${money(totals.byCurrency.EUR.expense, 'EUR')} + ${money(totals.byCurrency.RON.expense)}`} />
                    <StatCard label="Profit (echiv. RON)" value={money(totals.profit)} tone={totals.profit >= 0 ? 'green' : 'red'} />
                </div>
            )}

            <Card className="mb-4" title={mode === 'all' ? '📊 Evoluție lunară' : `📊 Evoluție lunară ${year}`}
                action={<span className="text-xs text-gray-400">Apasă pe o lună ca s-o vezi</span>}>
                {chartSummary && chartSummary.byMonth.length > 0
                    ? <Chart options={chartOptions} series={chartSeries} type="bar" height={260} />
                    : <p className="text-sm text-gray-500">Nicio tranzacție în această perioadă.</p>}
            </Card>

            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <Card title="Cheltuieli pe categorii">
                    {!summary?.byCategory.length
                        ? <p className="text-sm text-gray-500">Nicio cheltuială.</p>
                        : (
                            <div className="flex flex-col gap-3">
                                {summary.byCategory.map((c) => (
                                    <div key={c.category}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-300">{categoryIcon(c.category)} {c.category}</span>
                                            <span className="font-semibold text-gray-800 dark:text-white/90">{money(c.expense)}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10">
                                            <div className="h-full rounded-full bg-error-500" style={{ width: `${(c.expense / maxCategory) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </Card>
                <Card title="Profit pe vehicul">
                    {!summary?.byVehicle.length
                        ? <p className="text-sm text-gray-500">Nicio tranzacție.</p>
                        : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500">
                                        <th className="pb-2 font-medium">Vehicul</th>
                                        <th className="pb-2 text-right font-medium">Încasări</th>
                                        <th className="pb-2 text-right font-medium">Cheltuieli</th>
                                        <th className="pb-2 text-right font-medium">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.byVehicle.map((v) => (
                                        <tr key={v.vehicleId ?? 'general'} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="py-2 font-medium text-gray-800 dark:text-white/90">{plateOf(v.vehicleId)}</td>
                                            <td className="py-2 text-right text-success-600 dark:text-success-500">{money(v.income)}</td>
                                            <td className="py-2 text-right text-error-600 dark:text-error-400">{money(v.expense)}</td>
                                            <td className={`py-2 text-right font-semibold ${v.profit >= 0 ? 'text-success-600 dark:text-success-500' : 'text-error-600 dark:text-error-400'}`}>{money(v.profit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                </Card>
            </div>

            <Card title="📜 Istoric" action={<ActionButton size="sm" variant="outline" onClick={() => exportCsv(transactions, plateOf)} disabled={!transactions.length}>📥 Export Excel (CSV)</ActionButton>}>
                <Pills label="Tip tranzacție" value={typeFilter} onChange={setTypeFilter} options={[
                    { value: 'all', label: 'Toate' },
                    { value: 'INCOME', label: 'Încasări' },
                    { value: 'EXPENSE', label: 'Cheltuieli' },
                ]} />
                {isLoading && <p className="text-sm text-gray-500">Se încarcă…</p>}
                {!isLoading && transactions.length === 0 && <EmptyState icon="🧾" title="Nicio tranzacție în perioada aleasă" />}
                {transactions.map((t) => (
                    <TransactionRow key={t.id} transaction={t} vehiclePlate={t.vehicleId ? plates.get(t.vehicleId) ?? '—' : null} actions={
                        <div className="flex gap-1">
                            <button type="button" aria-label="Editează" onClick={() => setEditing({ tx: t, type: t.type })} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">✎</button>
                            <button type="button" aria-label="Șterge" onClick={() => confirmDelete(t)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-error-600 dark:hover:bg-white/5">✕</button>
                        </div>
                    } />
                ))}
            </Card>

            <TransactionFormModal isOpen={!!editing} type={editing?.type} transaction={editing?.tx} onClose={() => setEditing(null)} />
        </>
    );
}
