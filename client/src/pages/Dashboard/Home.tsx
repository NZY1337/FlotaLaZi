import { useState } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/ui/alert/Alert';
import { ActionButton, Card, EmptyState, LevelBadge, PageHeader } from '../../components/fleet/ui';
import StatCard from '../../components/fleet/StatCard';
import DocumentRow from '../../components/fleet/DocumentRow';
import OilBar from '../../components/fleet/OilBar';
import TransactionRow from '../../components/fleet/TransactionRow';
import TransactionFormModal from '../../components/fleet/TransactionFormModal';
import VehicleFormModal from '../../components/fleet/VehicleFormModal';
import DocumentFormModal from '../../components/fleet/DocumentFormModal';
import { useDashboard } from '../../hooks/useDashboard';
import { MONTHS_LONG, formatKm, money } from '../../helpers/fleet';
import type { TransactionType } from '../../services/transactions';

type Open = { kind: 'tx'; type: TransactionType } | { kind: 'truck' } | { kind: 'doc' } | null;

export default function Home() {
    const { dashboard, isLoading, isError } = useDashboard();
    const [open, setOpen] = useState<Open>(null);
    const close = () => setOpen(null);

    const monthName = dashboard ? MONTHS_LONG[Number(dashboard.month.from.slice(5, 7)) - 1] : '';
    const totals = dashboard?.month.totals;
    const hasFleet = !!dashboard && dashboard.counts.trucks + dashboard.counts.trailers > 0;

    return (
        <>
            <PageMeta title="Panou - FlotaLaZi" description="Alertele și situația flotei tale." />
            <PageHeader
                title="Panou"
                subtitle="Ce expiră, ce revizii urmează și cât ai câștigat luna asta."
                actions={
                    <>
                        <ActionButton variant="success" onClick={() => setOpen({ kind: 'tx', type: 'INCOME' })}>+ Încasare</ActionButton>
                        <ActionButton variant="danger" onClick={() => setOpen({ kind: 'tx', type: 'EXPENSE' })}>+ Cheltuială</ActionButton>
                        <ActionButton variant="outline" onClick={() => setOpen({ kind: 'doc' })}>+ Act</ActionButton>
                    </>
                }
            />

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca panoul. Încearcă din nou." />}
            {isLoading && <p className="text-sm text-gray-500">Se încarcă…</p>}

            {dashboard && !hasFleet && (
                <div className="mb-6">
                    <EmptyState
                        icon="🚛"
                        title="Începe prin a-ți adăuga flota"
                        text="Adaugă camioanele și remorcile, apoi actele lor. Te anunțăm noi înainte să expire ceva."
                        action={
                            <>
                                <ActionButton onClick={() => setOpen({ kind: 'truck' })}>+ Adaugă camion</ActionButton>
                                <Link to="/settings" className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-brand-500 hover:text-brand-600">
                                    Am deja date (import backup)
                                </Link>
                            </>
                        }
                    />
                </div>
            )}

            {dashboard && totals && (
                <>
                    <div className="mb-6 grid gap-4 sm:grid-cols-3">
                        <StatCard label={`Încasări · ${monthName}`} value={money(totals.income)} tone="green"
                            sub={`${money(totals.byCurrency.EUR.income, 'EUR')} + ${money(totals.byCurrency.RON.income)}`} />
                        <StatCard label={`Cheltuieli · ${monthName}`} value={money(totals.expense)} tone="red"
                            sub={`${money(totals.byCurrency.EUR.expense, 'EUR')} + ${money(totals.byCurrency.RON.expense)}`} />
                        <StatCard label={`Profit · ${monthName}`} value={money(totals.profit)} tone={totals.profit >= 0 ? 'green' : 'red'}
                            sub={<Link to="/finance" className="text-brand-500 hover:text-brand-600">Vezi detalii →</Link>} />
                    </div>

                    <div className="mb-6 grid gap-4 lg:grid-cols-2">
                        <Card
                            title={`⚠️ Acte care necesită atenție${dashboard.urgentDocumentCount ? ` (${dashboard.urgentDocumentCount})` : ''}`}
                            action={<Link to="/documents" className="text-xs font-medium text-brand-500">Toate actele →</Link>}
                        >
                            {dashboard.documentAlerts.length === 0
                                ? <p className="text-sm text-gray-500">✅ Niciun act nu expiră în curând.</p>
                                : <div className="flex flex-col gap-2">{dashboard.documentAlerts.map((d) => <DocumentRow key={d.id} document={d} />)}</div>}
                        </Card>

                        <Card title="🛢️ Schimb ulei" action={<Link to="/fleet" className="text-xs font-medium text-brand-500">Flotă →</Link>}>
                            {dashboard.oil.length === 0
                                ? <p className="text-sm text-gray-500">Niciun camion cu schimbul de ulei configurat.</p>
                                : (
                                    <div className="flex flex-col gap-4">
                                        {dashboard.oil.map((o) => (
                                            <div key={o.vehicleId}>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{o.plate}</span>
                                                    <span className="flex items-center gap-2 text-xs text-gray-500">
                                                        {formatKm(o.km)}
                                                        <LevelBadge level={o.level}>{o.level === 'red' ? 'Urgent' : o.level === 'yellow' ? 'În curând' : 'OK'}</LevelBadge>
                                                    </span>
                                                </div>
                                                <OilBar oil={o} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </Card>
                    </div>

                    <Card title="🕒 Ultimele cheltuieli" action={<Link to="/finance" className="text-xs font-medium text-brand-500">Tot istoricul →</Link>}>
                        {dashboard.recentExpenses.length === 0
                            ? <p className="text-sm text-gray-500">Nicio cheltuială înregistrată.</p>
                            : dashboard.recentExpenses.map((t) => <TransactionRow key={t.id} transaction={t} vehiclePlate={t.vehiclePlate} />)}
                    </Card>
                </>
            )}

            <TransactionFormModal isOpen={open?.kind === 'tx'} type={open?.kind === 'tx' ? open.type : 'EXPENSE'} onClose={close} />
            <VehicleFormModal isOpen={open?.kind === 'truck'} kind="TRUCK" onClose={close} />
            <DocumentFormModal isOpen={open?.kind === 'doc'} onClose={close} />
        </>
    );
}
