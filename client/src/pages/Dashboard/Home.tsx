import { useEffect, useRef, useState } from 'react';
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
import { takePendingAccountType, useAccountType, useSettings } from '../../hooks/useSettings';
import type { AccountType } from '../../services/settings';
import { MONTHS_LONG, formatKm, money } from '../../helpers/fleet';
import type { TransactionType } from '../../services/transactions';

type Open = { kind: 'tx'; type: TransactionType } | { kind: 'truck' } | { kind: 'car' } | { kind: 'doc' } | null;

/** First visit of an account that hasn't said what it is for. */
function ChooseAccountType({ onChoose, pending }: { onChoose: (t: AccountType) => void; pending: boolean }) {
    const option = (type: AccountType, icon: string, title: string, text: string) => (
        <button type="button" disabled={pending} onClick={() => onChoose(type)}
            className="flex flex-1 flex-col items-start gap-2 rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition hover:border-brand-500 disabled:opacity-60 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-3xl">{icon}</span>
            <span className="text-lg font-bold text-gray-800 dark:text-white/90">{title}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{text}</span>
        </button>
    );
    return (
        <div className="mb-6">
            <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-white/90">Ce vrei să urmărești cu FlotaLaZi?</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Alegi o dată; poți schimba oricând din Setări.</p>
            <div className="flex flex-col gap-4 sm:flex-row">
                {option('FIRM', '🚛', 'Firma mea de transport', 'Camioane, remorci, șoferi, acte și profitul pe fiecare camion.')}
                {option('PERSONAL', '🚗', 'Mașina mea', 'ITP, RCA, rovinietă și schimbul de ulei. Gratuit pentru o mașină.')}
            </div>
        </div>
    );
}

export default function Home() {
    const { dashboard, isLoading, isError } = useDashboard();
    const { accountType, personal, loaded } = useAccountType();
    const { update: updateSettings } = useSettings();
    const [open, setOpen] = useState<Open>(null);
    const close = () => setOpen(null);
    const choose = (type: AccountType) => updateSettings.mutate({ accountType: type });

    // Came from /masina → sign-up: apply that choice once, instead of asking.
    const appliedPending = useRef(false);
    useEffect(() => {
        if (!loaded || accountType !== null || appliedPending.current) return;
        appliedPending.current = true;
        if (takePendingAccountType() === 'PERSONAL') updateSettings.mutate({ accountType: 'PERSONAL' });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the settings first arrive
    }, [loaded, accountType]);

    const monthName = dashboard ? MONTHS_LONG[Number(dashboard.month.from.slice(5, 7)) - 1] : '';
    const totals = dashboard?.month.totals;
    const hasFleet = !!dashboard && dashboard.counts.trucks + dashboard.counts.trailers + dashboard.counts.cars > 0;
    const mustChoose = loaded && accountType === null && !!dashboard && !hasFleet && !updateSettings.isPending;

    return (
        <>
            <PageMeta title="Panou - FlotaLaZi" description="Alertele și situația flotei tale." />
            <PageHeader
                title="Panou"
                subtitle={mustChoose ? 'Bun venit în FlotaLaZi.' : personal ? 'Ce expiră și când e schimbul de ulei.' : 'Ce expiră, ce revizii urmează și cât ai câștigat luna asta.'}
                actions={mustChoose ? undefined : personal
                    ? <ActionButton variant="outline" onClick={() => setOpen({ kind: 'doc' })}>+ Act</ActionButton>
                    : (
                        <>
                            <ActionButton variant="success" onClick={() => setOpen({ kind: 'tx', type: 'INCOME' })}>+ Încasare</ActionButton>
                            <ActionButton variant="danger" onClick={() => setOpen({ kind: 'tx', type: 'EXPENSE' })}>+ Cheltuială</ActionButton>
                            <ActionButton variant="outline" onClick={() => setOpen({ kind: 'doc' })}>+ Act</ActionButton>
                        </>
                    )}
            />

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca panoul. Încearcă din nou." />}
            {isLoading && <p className="text-sm text-gray-500">Se încarcă…</p>}

            {mustChoose && <ChooseAccountType onChoose={choose} pending={updateSettings.isPending} />}

            {dashboard && !hasFleet && !mustChoose && personal && (
                <div className="mb-6">
                    <EmptyState
                        icon="🚗"
                        title="Începe cu mașina ta"
                        text="Adaugă mașina, apoi datele de expirare: ITP, RCA, rovinietă. Te anunțăm noi pe email înainte să expire ceva."
                        action={<ActionButton onClick={() => setOpen({ kind: 'car' })}>+ Adaugă mașina</ActionButton>}
                    />
                </div>
            )}

            {dashboard && !hasFleet && !mustChoose && !personal && (
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

            {dashboard && totals && !mustChoose && (
                <>
                    {!personal && <div className="mb-6 grid gap-4 sm:grid-cols-3">
                        <StatCard label={`Încasări · ${monthName}`} value={money(totals.income)} tone="green"
                            sub={`${money(totals.byCurrency.EUR.income, 'EUR')} + ${money(totals.byCurrency.RON.income)}`} />
                        <StatCard label={`Cheltuieli · ${monthName}`} value={money(totals.expense)} tone="red"
                            sub={`${money(totals.byCurrency.EUR.expense, 'EUR')} + ${money(totals.byCurrency.RON.expense)}`} />
                        <StatCard label={`Profit · ${monthName}`} value={money(totals.profit)} tone={totals.profit >= 0 ? 'green' : 'red'}
                            sub={<Link to="/finance" className="text-brand-500 hover:text-brand-600">Vezi detalii →</Link>} />
                    </div>}

                    <div className="mb-6 grid gap-4 lg:grid-cols-2">
                        <Card
                            title={`⚠️ Acte care necesită atenție${dashboard.urgentDocumentCount ? ` (${dashboard.urgentDocumentCount})` : ''}`}
                            action={<Link to="/documents" className="text-xs font-medium text-brand-500">Toate actele →</Link>}
                        >
                            {dashboard.documentAlerts.length === 0
                                ? <p className="text-sm text-gray-500">✅ Niciun act nu expiră în curând.</p>
                                : <div className="flex flex-col gap-2">{dashboard.documentAlerts.map((d) => <DocumentRow key={d.id} document={d} />)}</div>}
                        </Card>

                        <Card title="🛢️ Schimb ulei" action={<Link to="/fleet" className="text-xs font-medium text-brand-500">{personal ? 'Mașinile mele →' : 'Flotă →'}</Link>}>
                            {dashboard.oil.length === 0
                                ? <p className="text-sm text-gray-500">{personal ? 'Nicio mașină cu schimbul de ulei configurat.' : 'Niciun camion cu schimbul de ulei configurat.'}</p>
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

                    {!personal && <Card title="🕒 Ultimele cheltuieli" action={<Link to="/finance" className="text-xs font-medium text-brand-500">Tot istoricul →</Link>}>
                        {dashboard.recentExpenses.length === 0
                            ? <p className="text-sm text-gray-500">Nicio cheltuială înregistrată.</p>
                            : dashboard.recentExpenses.map((t) => <TransactionRow key={t.id} transaction={t} vehiclePlate={t.vehiclePlate} />)}
                    </Card>}
                </>
            )}

            <TransactionFormModal isOpen={open?.kind === 'tx'} type={open?.kind === 'tx' ? open.type : 'EXPENSE'} onClose={close} />
            <VehicleFormModal isOpen={open?.kind === 'truck' || open?.kind === 'car'} kind={open?.kind === 'car' ? 'CAR' : 'TRUCK'} onClose={close} />
            <DocumentFormModal isOpen={open?.kind === 'doc'} onClose={close} />
        </>
    );
}
