import { useEffect, useState } from 'react';
import { FormModal, Row, SelectField, TextField } from './ui';
import { useVehicles } from '../../hooks/useVehicles';
import { numberOrNull } from '../../helpers/fleet';
import type { TrailerType, Vehicle, VehicleInput, VehicleKind } from '../../services/vehicles';

type Props = { isOpen: boolean; onClose: () => void; kind: VehicleKind; vehicle?: Vehicle | null };

const str = (v: number | string | null | undefined) => (v == null ? '' : String(v));

export default function VehicleFormModal({ isOpen, onClose, kind, vehicle }: Props) {
    const { trailers, create, update } = useVehicles();
    const isTruck = kind === 'TRUCK';
    const [form, setForm] = useState(() => initial(vehicle));
    const mutation = vehicle ? update : create;

    useEffect(() => {
        if (isOpen) {
            setForm(initial(vehicle));
            create.reset();
            update.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens
    }, [isOpen, vehicle]);

    const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const submit = () => {
        const input: VehicleInput = {
            plate: form.plate,
            name: form.name,
            vin: form.vin,
            notes: form.notes,
        };
        if (isTruck) {
            Object.assign(input, {
                attachedTrailerId: form.attachedTrailerId || null,
                km: numberOrNull(form.km),
                lastOilKm: numberOrNull(form.lastOilKm),
                oilIntervalKm: numberOrNull(form.oilIntervalKm),
                lastOilDate: form.lastOilDate || null,
                oilIntervalMonths: numberOrNull(form.oilIntervalMonths),
            });
        } else {
            input.trailerType = form.trailerType as TrailerType;
        }
        const done = { onSuccess: onClose };
        if (vehicle) update.mutate({ id: vehicle.id, input }, done);
        else create.mutate({ ...input, kind }, done);
    };

    const trailerOptions = [
        { value: '', label: '— Fără remorcă —' },
        ...trailers.map((t) => ({
            value: t.id,
            label: `${t.plate}${t.name ? ` · ${t.name}` : ''}${t.coupledTruck && t.coupledTruck.id !== vehicle?.id ? ` (acum pe ${t.coupledTruck.plate})` : ''}`,
        })),
    ];

    const title = `${vehicle ? 'Editează' : 'Adaugă'} ${isTruck ? 'camion' : 'remorcă / semiremorcă'}`;

    return (
        <FormModal title={title} isOpen={isOpen} onClose={onClose} onSubmit={submit} pending={mutation.isPending} error={mutation.error}>
            <Row>
                <TextField label="Nr. înmatriculare" value={form.plate} onChange={set('plate')} required uppercase placeholder="ex: NT 08 RGT" />
                {isTruck
                    ? <TextField label="Marcă / model" value={form.name} onChange={set('name')} placeholder="ex: Scania R500" />
                    : <SelectField label="Tip" value={form.trailerType} onChange={set('trailerType')} options={[{ value: 'SEMIREMORCA', label: 'Semiremorcă' }, { value: 'REMORCA', label: 'Remorcă' }]} />}
            </Row>
            {!isTruck && <TextField label="Marcă / caroserie" value={form.name} onChange={set('name')} placeholder="ex: Schmitz Cargobull prelată" />}
            <TextField label="Serie șasiu (VIN)" value={form.vin} onChange={set('vin')} uppercase placeholder="opțional" />
            {isTruck && (
                <>
                    <SelectField label="Remorcă cuplată" value={form.attachedTrailerId} onChange={set('attachedTrailerId')} options={trailerOptions} />
                    <TextField label="Kilometraj actual" type="number" min={0} value={form.km} onChange={set('km')} />
                    <Row>
                        <TextField label="Ultimul schimb de ulei la (km)" type="number" min={0} value={form.lastOilKm} onChange={set('lastOilKm')} />
                        <TextField label="Interval schimb (km)" type="number" min={1000} value={form.oilIntervalKm} onChange={set('oilIntervalKm')} />
                    </Row>
                    <Row>
                        <TextField label="Data ultimului schimb" type="date" value={form.lastOilDate} onChange={set('lastOilDate')} />
                        <TextField label="Interval maxim (luni)" type="number" min={1} max={60} value={form.oilIntervalMonths} onChange={set('oilIntervalMonths')} />
                    </Row>
                </>
            )}
            <TextField label="Observații" value={form.notes} onChange={set('notes')} placeholder={isTruck ? 'opțional' : 'ex: axe SAF, anvelope 385/65 R22.5'} />
        </FormModal>
    );
}

function initial(v?: Vehicle | null) {
    return {
        plate: v?.plate ?? '',
        name: v?.name ?? '',
        vin: v?.vin ?? '',
        notes: v?.notes ?? '',
        trailerType: v?.trailerType ?? 'SEMIREMORCA',
        attachedTrailerId: v?.attachedTrailerId ?? '',
        km: str(v?.km),
        lastOilKm: str(v?.lastOilKm),
        oilIntervalKm: v ? str(v.oilIntervalKm) : '50000',
        lastOilDate: v?.lastOilDate ?? '',
        oilIntervalMonths: v ? str(v.oilIntervalMonths) : '12',
    };
}
