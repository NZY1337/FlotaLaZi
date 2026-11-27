import { useEffect, useState } from 'react';
import { FormModal, NumberField, Row, SelectField, TextField, DateField } from './ui';
import { useVehicles } from '../../hooks/useVehicles';
import { parseNumberInput, todayInput } from '../../helpers/fleet';
import type { TrailerType, Vehicle, VehicleInput, VehicleKind } from '../../services/vehicles';

type Props = { isOpen: boolean; onClose: () => void; kind: VehicleKind; vehicle?: Vehicle | null };

const str = (v: number | string | null | undefined) => (v == null ? '' : String(v));

export default function VehicleFormModal({ isOpen, onClose, kind, vehicle }: Props) {
    const { trailers, create, update } = useVehicles();
    const isTruck = kind === 'TRUCK';
    const isCar = kind === 'CAR';
    const hasEngine = kind !== 'TRAILER';
    const [form, setForm] = useState(() => initial(vehicle, kind));
    const mutation = vehicle ? update : create;

    useEffect(() => {
        if (isOpen) {
            setForm(initial(vehicle, kind));
            create.reset();
            update.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens
    }, [isOpen, vehicle, kind]);

    const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const submit = () => {
        const input: VehicleInput = {
            plate: form.plate,
            name: form.name,
            vin: form.vin,
            notes: form.notes,
        };
        if (hasEngine) {
            Object.assign(input, {
                ...(isTruck ? { attachedTrailerId: form.attachedTrailerId || null } : {}),
                km: parseNumberInput(form.km, 0),
                lastOilKm: parseNumberInput(form.lastOilKm, 0),
                oilIntervalKm: parseNumberInput(form.oilIntervalKm, 0),
                lastOilDate: form.lastOilDate || null,
                oilIntervalMonths: parseNumberInput(form.oilIntervalMonths, 0),
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

    const title = `${vehicle ? 'Editează' : 'Adaugă'} ${isCar ? 'mașină' : isTruck ? 'camion' : 'remorcă / semiremorcă'}`;

    return (
        <FormModal title={title} isOpen={isOpen} onClose={onClose} onSubmit={submit} pending={mutation.isPending} error={mutation.error}>
            <Row>
                <TextField label="Nr. înmatriculare" value={form.plate} onChange={set('plate')} required uppercase placeholder={isCar ? 'ex: B 123 ABC' : 'ex: NT 08 RGT'} />
                {hasEngine
                    ? <TextField label="Marcă / model" value={form.name} onChange={set('name')} placeholder={isCar ? 'ex: Dacia Logan' : 'ex: Scania R500'} />
                    : <SelectField label="Tip" value={form.trailerType} onChange={set('trailerType')} options={[{ value: 'SEMIREMORCA', label: 'Semiremorcă' }, { value: 'REMORCA', label: 'Remorcă' }]} />}
            </Row>
            {!hasEngine && <TextField label="Marcă / caroserie" value={form.name} onChange={set('name')} placeholder="ex: Schmitz Cargobull prelată" />}
            <TextField label="Serie șasiu (VIN)" value={form.vin} onChange={set('vin')} uppercase placeholder="opțional" />
            {hasEngine && (
                <>
                    {isTruck && <SelectField label="Remorcă cuplată" value={form.attachedTrailerId} onChange={set('attachedTrailerId')} options={trailerOptions} />}
                    <NumberField label="Kilometraj actual" unit="km" min={0} value={form.km} onChange={set('km')} />
                    <Row>
                        <NumberField label="Ultimul schimb de ulei la (km)" unit="km" min={0} value={form.lastOilKm} onChange={set('lastOilKm')} />
                        <NumberField label="Interval schimb (km)" unit="km" min={1000} value={form.oilIntervalKm} onChange={set('oilIntervalKm')} />
                    </Row>
                    <Row>
                        <DateField label="Data ultimului schimb" value={form.lastOilDate} onChange={set('lastOilDate')} max={todayInput()} />
                        <TextField label="Interval maxim (luni)" type="number" min={1} max={60} value={form.oilIntervalMonths} onChange={set('oilIntervalMonths')} />
                    </Row>
                </>
            )}
            <TextField label="Observații" value={form.notes} onChange={set('notes')} placeholder={hasEngine ? 'opțional' : 'ex: axe SAF, anvelope 385/65 R22.5'} />
        </FormModal>
    );
}

// Usual oil intervals for a new vehicle: a truck ~50.000 km, a car ~15.000 km.
function initial(v: Vehicle | null | undefined, kind: VehicleKind) {
    return {
        plate: v?.plate ?? '',
        name: v?.name ?? '',
        vin: v?.vin ?? '',
        notes: v?.notes ?? '',
        trailerType: v?.trailerType ?? 'SEMIREMORCA',
        attachedTrailerId: v?.attachedTrailerId ?? '',
        km: str(v?.km),
        lastOilKm: str(v?.lastOilKm),
        oilIntervalKm: v ? str(v.oilIntervalKm) : kind === 'CAR' ? '15000' : '50000',
        lastOilDate: v?.lastOilDate ?? '',
        oilIntervalMonths: v ? str(v.oilIntervalMonths) : '12',
    };
}
