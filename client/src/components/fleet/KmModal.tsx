import { useEffect, useState } from 'react';
import { FormModal, NumberField, Row, SelectField, TextField } from './ui';
import { useVehicles } from '../../hooks/useVehicles';
import { parseNumberInput, todayInput } from '../../helpers/fleet';
import type { Currency } from '../../services/transactions';
import type { Vehicle } from '../../services/vehicles';

type Props = { truck: Vehicle | null; mode: 'km' | 'oil'; onClose: () => void };

// Two quick actions on a truck card: update the odometer, or record an oil change.
export default function KmModal({ truck, mode, onClose }: Props) {
    const { update, oilChange } = useVehicles();
    const [km, setKm] = useState('');
    const [date, setDate] = useState(todayInput());
    const [cost, setCost] = useState('');
    const [currency, setCurrency] = useState<Currency>('RON');
    const mutation = mode === 'oil' ? oilChange : update;

    useEffect(() => {
        if (truck) {
            setKm(truck.km == null ? '' : String(truck.km));
            setDate(todayInput());
            setCost('');
            update.reset();
            oilChange.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a truck is picked
    }, [truck, mode]);

    if (!truck) return null;

    const submit = () => {
        const done = { onSuccess: onClose };
        if (mode === 'km') {
            update.mutate({ id: truck.id, input: { km: parseNumberInput(km, 0) ?? 0 } }, done);
        } else {
            oilChange.mutate({ id: truck.id, input: { km: parseNumberInput(km, 0) ?? 0, date, ...(cost.trim() ? { cost: parseNumberInput(cost, 2) ?? 0, currency } : {}) } }, done);
        }
    };

    return (
        <FormModal
            title={mode === 'oil' ? `Schimb ulei făcut — ${truck.plate}` : `Actualizează km — ${truck.plate}`}
            isOpen
            onClose={onClose}
            onSubmit={submit}
            pending={mutation.isPending}
            error={mutation.error}
        >
            <NumberField label="Kilometraj din bord" unit="km" min={0} value={km} onChange={setKm} required />
            {mode === 'oil' && (
                <>
                    <TextField label="Data schimbului" type="date" value={date} onChange={setDate} required />
                    <Row>
                        <NumberField label="Cost (opțional)" decimals={2} unit={currency === 'EUR' ? '€' : 'lei'} min={0} value={cost} onChange={setCost} hint="Se adaugă automat la cheltuieli." />
                        <SelectField label="Monedă" value={currency} onChange={(v) => setCurrency(v as Currency)} options={[{ value: 'RON', label: 'RON' }, { value: 'EUR', label: 'EUR' }]} />
                    </Row>
                </>
            )}
        </FormModal>
    );
}
