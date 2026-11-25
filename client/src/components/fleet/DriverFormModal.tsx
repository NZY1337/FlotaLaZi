import { useEffect, useState } from 'react';
import { FormModal, Row, TextField } from './ui';
import { useDrivers } from '../../hooks/useDrivers';
import type { Driver } from '../../services/drivers';

type Props = { isOpen: boolean; onClose: () => void; driver?: Driver | null };

export default function DriverFormModal({ isOpen, onClose, driver }: Props) {
    const { create, update } = useDrivers();
    const mutation = driver ? update : create;
    const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

    useEffect(() => {
        if (isOpen) {
            setForm({ name: driver?.name ?? '', phone: driver?.phone ?? '', email: driver?.email ?? '', notes: driver?.notes ?? '' });
            create.reset();
            update.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens
    }, [isOpen, driver]);

    const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const submit = () => {
        const done = { onSuccess: onClose };
        if (driver) update.mutate({ id: driver.id, input: form }, done);
        else create.mutate(form, done);
    };

    return (
        <FormModal title={driver ? 'Editează șofer' : 'Adaugă șofer'} isOpen={isOpen} onClose={onClose} onSubmit={submit}
            pending={mutation.isPending} error={mutation.error}>
            <TextField label="Nume" value={form.name} onChange={set('name')} required placeholder="ex: Ion Popescu" />
            <Row>
                <TextField label="Telefon" type="tel" value={form.phone} onChange={set('phone')} placeholder="07xx xxx xxx" />
                <TextField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="opțional" />
            </Row>
            <TextField label="Observații" value={form.notes} onChange={set('notes')} placeholder="opțional" />
        </FormModal>
    );
}
