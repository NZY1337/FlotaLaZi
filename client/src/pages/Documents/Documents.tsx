import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/ui/alert/Alert';
import { ActionButton, EmptyState, PageHeader, Pills } from '../../components/fleet/ui';
import DocumentRow from '../../components/fleet/DocumentRow';
import DocumentFormModal from '../../components/fleet/DocumentFormModal';
import { useDocuments } from '../../hooks/useDocuments';
import type { FleetDocument } from '../../services/documents';

type Filter = 'all' | 'urgent';

export default function Documents() {
    const { documents, isLoading, isError, remove } = useDocuments();
    const [filter, setFilter] = useState<Filter>('all');
    const [editing, setEditing] = useState<FleetDocument | null | undefined>(undefined);

    const urgentCount = documents.filter((d) => d.level !== 'green').length;
    const list = filter === 'urgent' ? documents.filter((d) => d.level !== 'green') : documents;

    const confirmDelete = (d: FleetDocument) => {
        if (window.confirm(`Ștergi ${d.type} — ${d.subject}?`)) remove.mutate(d.id);
    };

    return (
        <>
            <PageMeta title="Acte - FlotaLaZi" description="Acte și date de expirare." />
            <PageHeader
                title="Acte & expirări"
                subtitle="ITP, RCA, rovinietă, tahograf, copie conformă, licențe și actele șoferilor."
                actions={<ActionButton onClick={() => setEditing(null)}>+ Adaugă act</ActionButton>}
            />

            <Pills label="Filtru acte" value={filter} onChange={setFilter} options={[
                { value: 'all', label: `Toate (${documents.length})` },
                { value: 'urgent', label: `Expirate / urgente (${urgentCount})` },
            ]} />

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca actele." />}
            {isLoading && <p className="text-sm text-gray-500">Se încarcă…</p>}

            {!isLoading && list.length === 0 && (
                <EmptyState
                    icon={filter === 'urgent' ? '✅' : '📄'}
                    title={filter === 'urgent' ? 'Nimic urgent' : 'Niciun act adăugat'}
                    text={filter === 'urgent' ? 'Toate actele sunt valabile.' : 'Adaugă datele de expirare și te anunțăm din timp.'}
                />
            )}

            <div className="flex flex-col gap-2">
                {list.map((d) => (
                    <DocumentRow key={d.id} document={d} actions={
                        <>
                            <ActionButton size="sm" variant="outline" onClick={() => setEditing(d)}>Editează</ActionButton>
                            <ActionButton size="sm" variant="outline" onClick={() => confirmDelete(d)}>Șterge</ActionButton>
                        </>
                    } />
                ))}
            </div>

            <DocumentFormModal isOpen={editing !== undefined} document={editing} onClose={() => setEditing(undefined)} />
        </>
    );
}
