import { useEffect, useMemo, useState } from 'react';
import { DateShortcuts, FormModal, SelectField, TextField, DateField } from './ui';
import { useDocuments } from '../../hooks/useDocuments';
import { useVehicles } from '../../hooks/useVehicles';
import { useDrivers } from '../../hooks/useDrivers';
import { useAccountType, useSettings } from '../../hooks/useSettings';
import { CAR_DOCUMENT_TYPES, DOCUMENT_TYPES, DRIVER_DOCUMENT_TYPES, PERSONAL_DOCUMENT_TYPES, plusMonthsInput } from '../../helpers/fleet';
import type { Vehicle } from '../../services/vehicles';
import type { FleetDocument } from '../../services/documents';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    document?: FleetDocument | null;
    /** Preselect the subject, e.g. "v:<id>" or "d:<id>". */
    subject?: string;
};

const CUSTOM = '__custom__';
const FIRM = 'firm';

// The subject select encodes vehicle / driver / firm as "v:<id>" | "d:<id>" | "firm".
const subjectOf = (d?: FleetDocument | null) => (d?.vehicleId ? `v:${d.vehicleId}` : d?.driverId ? `d:${d.driverId}` : FIRM);

/** The usual document types for a subject; a personal account's own are ID papers. */
function typesFor(subject: string, vehicles: Vehicle[], personal: boolean): string[] {
    if (subject.startsWith('d:')) return DRIVER_DOCUMENT_TYPES;
    if (subject.startsWith('v:')) return vehicles.find((v) => v.id === subject.slice(2))?.kind === 'CAR' ? CAR_DOCUMENT_TYPES : DOCUMENT_TYPES;
    return personal ? PERSONAL_DOCUMENT_TYPES : DOCUMENT_TYPES;
}

export default function DocumentFormModal({ isOpen, onClose, document, subject }: Props) {
    const { create, update } = useDocuments();
    const { vehicles } = useVehicles();
    const { drivers } = useDrivers();
    const { settings } = useSettings();
    const { personal } = useAccountType();
    const mutation = document ? update : create;

    const [subjectValue, setSubject] = useState(FIRM);
    const [typeChoice, setTypeChoice] = useState('ITP');
    const [customType, setCustomType] = useState('');
    const [expiresOn, setExpiresOn] = useState('');
    const [alertDays, setAlertDays] = useState('30');
    const [notes, setNotes] = useState('');

    const typeList = typesFor(subjectValue, vehicles, personal);

    useEffect(() => {
        if (!isOpen) return;
        const subj = document ? subjectOf(document) : subject ?? (vehicles[0] ? `v:${vehicles[0].id}` : FIRM);
        const list = typesFor(subj, vehicles, personal);
        setSubject(subj);
        if (document) {
            const known = list.includes(document.type);
            setTypeChoice(known ? document.type : CUSTOM);
            setCustomType(known ? '' : document.type);
        } else {
            setTypeChoice(list[0]);
            setCustomType('');
        }
        setExpiresOn(document?.expiresOn ?? '');
        setAlertDays(String(document?.alertDays ?? settings?.docAlertDays ?? 30));
        setNotes(document?.notes ?? '');
        create.reset();
        update.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens
    }, [isOpen, document]);

    const subjectOptions = useMemo(() => [
        ...vehicles.map((v) => ({ value: `v:${v.id}`, label: `${v.kind === 'CAR' ? '🚗' : v.kind === 'TRUCK' ? '🚛' : '🚚'} ${v.plate}${v.name ? ` · ${v.name}` : ''}` })),
        ...(personal ? [] : drivers.map((d) => ({ value: `d:${d.id}`, label: `👤 ${d.name}` }))),
        personal ? { value: FIRM, label: '👤 Eu (permis, buletin)' } : { value: FIRM, label: '🏢 Firmă (general)' },
    ], [vehicles, drivers, personal]);

    const changeSubject = (value: string) => {
        setSubject(value);
        const list = typesFor(value, vehicles, personal);
        if (typeChoice !== CUSTOM && !list.includes(typeChoice)) setTypeChoice(list[0]);
    };

    const submit = () => {
        const input = {
            vehicleId: subjectValue.startsWith('v:') ? subjectValue.slice(2) : null,
            driverId: subjectValue.startsWith('d:') ? subjectValue.slice(2) : null,
            type: typeChoice === CUSTOM ? customType : typeChoice,
            expiresOn,
            alertDays: Number(alertDays),
            notes,
        };
        const done = { onSuccess: onClose };
        if (document) update.mutate({ id: document.id, input }, done);
        else create.mutate(input, done);
    };

    return (
        <FormModal title={document ? 'Editează act' : 'Adaugă act / expirare'} isOpen={isOpen} onClose={onClose} onSubmit={submit}
            pending={mutation.isPending} error={mutation.error}>
            <SelectField label="Pentru" value={subjectValue} onChange={changeSubject} options={subjectOptions} required />
            <SelectField label="Tip act" value={typeChoice} onChange={setTypeChoice} required
                options={[...typeList.map((t) => ({ value: t, label: t })), { value: CUSTOM, label: 'Alt act (scriu eu)…' }]} />
            {typeChoice === CUSTOM && <TextField label="Numele actului" value={customType} onChange={setCustomType} required placeholder="ex: Asigurare CMR" />}
            <div>
                <DateField label="Data expirării" value={expiresOn} onChange={setExpiresOn} required />
                <DateShortcuts onPick={(m) => setExpiresOn(plusMonthsInput(m, expiresOn))} />
            </div>
            <TextField label="Anunță-mă cu câte zile înainte" type="number" min={1} max={365} value={alertDays} onChange={setAlertDays} required />
            <TextField label="Observații" value={notes} onChange={setNotes} placeholder="ex: poliță Allianz, valabilă 1 an" />
        </FormModal>
    );
}
