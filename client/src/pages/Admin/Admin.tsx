import PageMeta from '../../components/common/PageMeta';
import { Card, EmptyState, PageHeader } from '../../components/fleet/ui';
import StatCard from '../../components/fleet/StatCard';
import { useAdminOverview } from '../../hooks/useAdmin';
import { formatDate, sinceLabel } from '../../helpers/fleet';
import type { AdminClient } from '../../services/admin';

// Platform owner's view: who signed up, who uses the app, how much they keep in
// it. Counts only — no client's amounts or documents.

const started = (c: AdminClient) => c.trucks + c.trailers + c.documents + c.transactions > 0;

export default function Admin() {
    const { overview, isLoading, isError } = useAdminOverview();

    if (isError) {
        return <EmptyState icon="🔒" title="Pagina nu există" text="Nu ai acces la această pagină." />;
    }
    if (isLoading || !overview) {
        return <p className="text-sm text-gray-500">Se încarcă…</p>;
    }

    const { totals, clients } = overview;
    return (
        <>
            <PageMeta title="Admin - FlotaLaZi" description="Clienți și utilizare." />
            <PageHeader title="Admin" subtitle="Clienții tăi și cât folosesc aplicația." />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Clienți" value={totals.users} sub={`+${totals.newUsers7d} în 7 zile · +${totals.newUsers30d} în 30 de zile`} />
                <StatCard label="Activi (7 zile)" value={totals.activeUsers7d} tone="green" />
                <StatCard label="Camioane / remorci" value={`${totals.trucks} / ${totals.trailers}`} sub={`${totals.drivers} șoferi`} />
                <StatCard label="Alerte trimise azi" value={totals.alertsToday} sub={`${totals.documents} acte · ${totals.transactions} tranzacții`} />
            </div>

            <Card title={`Clienți (${clients.length})`} className="mt-6">
                <div className="-mx-5 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800">
                                <th className="px-5 py-2 font-medium">Client</th>
                                <th className="px-3 py-2 font-medium">Înregistrat</th>
                                <th className="px-3 py-2 font-medium">Ultima activitate</th>
                                <th className="px-3 py-2 text-right font-medium">Camioane</th>
                                <th className="px-3 py-2 text-right font-medium">Remorci</th>
                                <th className="px-3 py-2 text-right font-medium">Șoferi</th>
                                <th className="px-3 py-2 text-right font-medium">Acte</th>
                                <th className="px-3 py-2 text-right font-medium">Tranzacții</th>
                                <th className="px-5 py-2 font-medium">Alerte email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((c) => (
                                <tr key={c.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-gray-800 dark:text-white/90">
                                            {c.name || '—'}
                                            {c.role === 'admin' && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">admin</span>}
                                            {!started(c) && <span className="ml-2 rounded bg-warning-50 px-1.5 py-0.5 text-xs text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">n-a început</span>}
                                        </p>
                                        <p className="text-xs text-gray-500">{c.email}</p>
                                    </td>
                                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{formatDate(c.createdAt.slice(0, 10))}</td>
                                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{sinceLabel(c.lastSeenAt)}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{c.trucks}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{c.trailers}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{c.drivers}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{c.documents}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{c.transactions}</td>
                                    <td className="px-5 py-3">{c.emailAlerts ? 'Da' : <span className="text-error-600 dark:text-error-400">Nu</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
