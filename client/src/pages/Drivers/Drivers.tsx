import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/ui/alert/Alert';
import { ActionButton, EmptyState, PageHeader, cardClasses } from '../../components/fleet/ui';
import DocumentRow from '../../components/fleet/DocumentRow';
import DriverFormModal from '../../components/fleet/DriverFormModal';
import DocumentFormModal from '../../components/fleet/DocumentFormModal';
import { useDrivers } from '../../hooks/useDrivers';
import { useDocuments } from '../../hooks/useDocuments';
import type { Driver } from '../../services/drivers';

export default function Drivers() {
    const { drivers, isLoading, isError, remove } = useDrivers();
    const { documents } = useDocuments();
    const [editing, setEditing] = useState<Driver | null | undefined>(undefined);
    const [docFor, setDocFor] = useState<string | null>(null);

    const confirmDelete = (d: Driver) => {
        if (window.confirm(`Ștergi șoferul ${d.name}? Actele lui se șterg și ele.`)) remove.mutate(d.id);
    };

    return (
        <>
            <PageMeta title="Șoferi - FlotaLaZi" description="Șoferi și actele lor." />
            <PageHeader
                title="Șoferi"
                subtitle="Permis, atestat, card tahograf, avize — cu alertă înainte de expirare."
                actions={<ActionButton onClick={() => setEditing(null)}>+ Adaugă șofer</ActionButton>}
            />

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca șoferii." />}
            {isLoading && <p className="text-sm text-gray-500">Se încarcă…</p>}

            {!isLoading && drivers.length === 0 && (
                <EmptyState icon="👤" title="Niciun șofer adăugat" text="Adaugă șoferii ca să le urmărești actele (permis, atestat, card tahograf)." />
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                {drivers.map((d) => {
                    const docs = documents.filter((doc) => doc.driverId === d.id);
                    return (
                        <article key={d.id} className={`${cardClasses} p-5`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{d.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {d.phone ? <a href={`tel:${d.phone}`} className="hover:text-brand-500">📞 {d.phone}</a> : 'fără telefon'}
                                        {d.email ? ` · ${d.email}` : ''}
                                    </p>
                                    {d.notes && <p className="mt-1 text-xs text-gray-500">{d.notes}</p>}
                                </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                                {docs.length === 0
                                    ? <p className="text-xs text-gray-400">Niciun act adăugat.</p>
                                    : docs.map((doc) => <DocumentRow key={doc.id} document={doc} />)}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <ActionButton size="sm" variant="outline" onClick={() => setDocFor(`d:${d.id}`)}>+ Act</ActionButton>
                                <ActionButton size="sm" variant="outline" onClick={() => setEditing(d)}>Editează</ActionButton>
                                <ActionButton size="sm" variant="outline" onClick={() => confirmDelete(d)}>Șterge</ActionButton>
                            </div>
                        </article>
                    );
                })}
            </div>

            <DriverFormModal isOpen={editing !== undefined} driver={editing} onClose={() => setEditing(undefined)} />
            <DocumentFormModal isOpen={!!docFor} subject={docFor ?? undefined} onClose={() => setDocFor(null)} />
        </>
    );
}
