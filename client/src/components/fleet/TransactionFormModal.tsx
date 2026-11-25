import { useEffect, useState } from 'react';
import { FormModal, Row, SelectField, TextField } from './ui';
import { useTransactionMutations } from '../../hooks/useTransactions';
import { useVehicles } from '../../hooks/useVehicles';
import { EXPENSE_CATEGORIES, FUEL_CATEGORY, INCOME_CATEGORIES, numberOrNull, todayInput } from '../../helpers/fleet';
import type { Currency, Transaction, TransactionType } from '../../services/transactions';

type Props = { isOpen: boolean; onClose: () => void; type?: TransactionType; transaction?: Transaction | null };

const major = (minor: number) => String(minor / 100);

export default function TransactionFormModal({ isOpen, onClose, type = 'EXPENSE', transaction }: Props) {
    const { create, update } = useTransactionMutations();
    const { vehicles } = useVehicles();
    const mutation = transaction ? update : create;

    const [txType, setTxType] = useState<TransactionType>(type);
    const [date, setDate] = useState(todayInput());
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>('RON');
    const [category, setCategory] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [liters, setLiters] = useState('');
    const [notes, setNotes] = useState('');

    const categories = txType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    useEffect(() => {
        if (!isOpen) return;
        const t = transaction;
        const kind = t?.type ?? type;
        setTxType(kind);
        setDate(t?.date ?? todayInput());
        setAmount(t ? major(t.amount) : '');
        setCurrency(t?.currency ?? (kind === 'INCOME' ? 'EUR' : 'RON'));
        setCategory(t?.category ?? (kind === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].name);
        setVehicleId(t?.vehicleId ?? '');
        setLiters(t?.liters == null ? '' : String(t.liters));
        setNotes(t?.notes ?? '');
        create.reset();
        update.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens
    }, [isOpen, transaction, type]);

    const changeType = (value: string) => {
        const kind = value as TransactionType;
        setTxType(kind);
        setCategory((kind === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].name);
    };

    const submit = () => {
        const input = {
            type: txType,
            date,
            amount: Number(amount.replace(',', '.')),
            currency,
            category,
            vehicleId: vehicleId || null,
            liters: category === FUEL_CATEGORY ? numberOrNull(liters) : null,
            notes,
        };
        const done = { onSuccess: onClose };
        if (transaction) update.mutate({ id: transaction.id, input }, done);
        else create.mutate(input, done);
    };

    const categoryOptions = categories.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }));
    if (category && !categories.some((c) => c.name === category)) categoryOptions.push({ value: category, label: category });

    return (
        <FormModal
            title={transaction ? 'Editează tranzacție' : txType === 'INCOME' ? '🟢 Adaugă încasare' : '🔴 Adaugă cheltuială'}
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={submit}
            pending={mutation.isPending}
            error={mutation.error}
        >
            {transaction && (
                <SelectField label="Tip" value={txType} onChange={changeType}
                    options={[{ value: 'INCOME', label: '🟢 Încasare' }, { value: 'EXPENSE', label: '🔴 Cheltuială' }]} />
            )}
            <Row>
                <TextField label="Sumă" type="number" min={0.01} step="0.01" value={amount} onChange={setAmount} required placeholder="0,00" />
                <SelectField label="Monedă" value={currency} onChange={(v) => setCurrency(v as Currency)} options={[{ value: 'RON', label: 'RON' }, { value: 'EUR', label: 'EUR' }]} />
            </Row>
            <Row>
                <SelectField label="Categorie" value={category} onChange={setCategory} options={categoryOptions} required />
                <TextField label="Data" type="date" value={date} onChange={setDate} required />
            </Row>
            <SelectField label="Camion / remorcă" value={vehicleId} onChange={setVehicleId}
                options={[{ value: '', label: '🏢 General / firmă' }, ...vehicles.map((v) => ({ value: v.id, label: `${v.kind === 'TRUCK' ? '🚛' : '🚚'} ${v.plate}` }))]} />
            {category === FUEL_CATEGORY && <TextField label="Litri (opțional)" type="number" min={0} step="0.01" value={liters} onChange={setLiters} />}
            <TextField label="Descriere" value={notes} onChange={setNotes} placeholder={txType === 'INCOME' ? 'ex: cursă Arad – München' : 'opțional'} />
        </FormModal>
    );
}
