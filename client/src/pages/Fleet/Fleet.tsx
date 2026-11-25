import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/ui/alert/Alert';
import { ActionButton, EmptyState, LevelBadge, PageHeader, Pills, cardClasses } from '../../components/fleet/ui';
import OilBar from '../../components/fleet/OilBar';
import VehicleFormModal from '../../components/fleet/VehicleFormModal';
import KmModal from '../../components/fleet/KmModal';
import DocumentFormModal from '../../components/fleet/DocumentFormModal';
import { useVehicles } from '../../hooks/useVehicles';
import { useDocuments } from '../../hooks/useDocuments';
import { formatKm } from '../../helpers/fleet';
import type { Vehicle, VehicleKind } from '../../services/vehicles';
import type { FleetDocument } from '../../services/documents';

type Filter = 'all' | 'trucks' | 'trailers';

function VinLine({ vin }: { vin: string }) {
    if (!vin) return null;
    return (
        <button type="button" title="Copiază VIN" onClick={() => navigator.clipboard?.writeText(vin)}
            className="font-mono text-xs text-gray-500 hover:text-brand-500 dark:text-gray-400">
            VIN {vin} ⧉
        </button>
    );
}

function DocChips({ docs }: { docs: FleetDocument[] }) {
    if (!docs.length) return <p className="text-xs text-gray-400">Niciun act adăugat.</p>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {docs.map((d) => <LevelBadge key={d.id} level={d.level}>{d.type}{d.level !== 'green' ? ` · ${d.daysLeft <= 0 ? 'expirat' : `${d.daysLeft}z`}` : ''}</LevelBadge>)}
        </div>
    );
}

export default function Fleet() {
    const { trucks, trailers, isLoading, isError, remove } = useVehicles();
    const { documents } = useDocuments();
    const [filter, setFilter] = useState<Filter>('all');
    const [form, setForm] = useState<{ kind: VehicleKind; vehicle: Vehicle | null } | null>(null);
    const [km, setKm] = useState<{ truck: Vehicle; mode: 'km' | 'oil' } | null>(null);
    const [docFor, setDocFor] = useState<string | null>(null);

    const docsOf = (id: string) => documents.filter((d) => d.vehicleId === id);

    const confirmDelete = (v: Vehicle) => {
        if (window.confirm(`Ștergi ${v.plate}? Actele lui se șterg; încasările și cheltuielile rămân în istoric.`)) remove.mutate(v.id);
    };

    const cardActions = (v: Vehicle) => (
        <div className="mt-4 flex flex-wrap gap-2">
            {v.kind === 'TRUCK' && (
                <>
                    <ActionButton size="sm" variant="outline" onClick={() => setKm({ truck: v, mode: 'km' })}>Actualizează km</ActionButton>
                    <ActionButton size="sm" variant="outline" onClick={() => setKm({ truck: v, mode: 'oil' })}>🛢️ Schimb ulei făcut</ActionButton>
                </>
            )}
            <ActionButton size="sm" variant="outline" onClick={() => setDocFor(`v:${v.id}`)}>+ Act</ActionButton>
            <ActionButton size="sm" variant="outline" onClick={() => setForm({ kind: v.kind, vehicle: v })}>Editează</ActionButton>
            <ActionButton size="sm" variant="outline" onClick={() => confirmDelete(v)}>Șterge</ActionButton>
        </div>
    );

    return (
        <>
            <PageMeta title="Flotă - EuroTrack" description="Camioane și remorci." />
            <PageHeader
                title="Flotă"
                subtitle="Camioane, remorci și semiremorci."
                actions={
                    <>
                        <ActionButton onClick={() => setForm({ kind: 'TRUCK', vehicle: null })}>+ Camion</ActionButton>
                        <ActionButton variant="outline" onClick={() => setForm({ kind: 'TRAILER', vehicle: null })}>+ Remorcă</ActionButton>
                    </>
                }
            />

            <Pills label="Filtru flotă" value={filter} onChange={setFilter} options={[
                { value: 'all', label: 'Toate' },
                { value: 'trucks', label: `🚛 Camioane (${trucks.length})` },
                { value: 'trailers', label: `🚚 Remorci (${trailers.length})` },
            ]} />

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca flota." />}
            {isLoading && <p className="text-sm text-gray-500">Se încarcă…</p>}

            {filter !== 'trailers' && (
                <section className="mb-8">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">🚛 Camioane</h2>
                    {!isLoading && trucks.length === 0
                        ? <EmptyState icon="🚛" title="Niciun camion" action={<ActionButton onClick={() => setForm({ kind: 'TRUCK', vehicle: null })}>+ Adaugă camion</ActionButton>} />
                        : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {trucks.map((t) => (
                                    <article key={t.id} className={`${cardClasses} p-5`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{t.plate}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.name || 'Camion'}</p>
                                                <VinLine vin={t.vin} />
                                            </div>
                                            <div className="text-right text-sm">
                                                <p className="font-semibold text-gray-800 dark:text-white/90">{formatKm(t.km)}</p>
                                                <p className="text-xs text-gray-500">🚚 {t.attachedTrailer?.plate ?? 'fără remorcă'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-3">
                                            {t.oil && <OilBar oil={t.oil} />}
                                            <DocChips docs={docsOf(t.id)} />
                                        </div>
                                        {cardActions(t)}
                                    </article>
                                ))}
                            </div>
                        )}
                </section>
            )}

            {filter !== 'trucks' && (
                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">🚚 Remorci & semiremorci</h2>
                    {!isLoading && trailers.length === 0
                        ? <EmptyState icon="🚚" title="Nicio remorcă" action={<ActionButton variant="outline" onClick={() => setForm({ kind: 'TRAILER', vehicle: null })}>+ Adaugă remorcă</ActionButton>} />
                        : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {trailers.map((r) => (
                                    <article key={r.id} className={`${cardClasses} p-5`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{r.plate}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {r.trailerType === 'REMORCA' ? 'Remorcă' : 'Semiremorcă'}{r.name ? ` · ${r.name}` : ''}
                                                </p>
                                                <VinLine vin={r.vin} />
                                            </div>
                                            <p className="text-xs text-gray-500">🚛 {r.coupledTruck?.plate ?? 'necuplată'}</p>
                                        </div>
                                        {r.notes && <p className="mt-2 text-xs text-gray-500">{r.notes}</p>}
                                        <div className="mt-4"><DocChips docs={docsOf(r.id)} /></div>
                                        {cardActions(r)}
                                    </article>
                                ))}
                            </div>
                        )}
                </section>
            )}

            <VehicleFormModal isOpen={!!form} kind={form?.kind ?? 'TRUCK'} vehicle={form?.vehicle} onClose={() => setForm(null)} />
            <KmModal truck={km?.truck ?? null} mode={km?.mode ?? 'km'} onClose={() => setKm(null)} />
            <DocumentFormModal isOpen={!!docFor} subject={docFor ?? undefined} onClose={() => setDocFor(null)} />
        </>
    );
}
