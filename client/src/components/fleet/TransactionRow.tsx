import type { ReactNode } from 'react';
import { categoryIcon, formatDate, money } from '../../helpers/fleet';
import type { Transaction } from '../../services/transactions';

export default function TransactionRow({ transaction: t, vehiclePlate, actions }: { transaction: Transaction; vehiclePlate?: string | null; actions?: ReactNode }) {
    const income = t.type === 'INCOME';
    return (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800">
            <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl" aria-hidden="true">{categoryIcon(t.category)}</span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{t.category}{t.notes ? ` · ${t.notes}` : ''}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(t.date)} · {vehiclePlate ?? 'General'}{t.liters ? ` · ${t.liters} L` : ''}
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                    <p className={`text-sm font-semibold ${income ? 'text-success-600 dark:text-success-500' : 'text-error-600 dark:text-error-400'}`}>
                        {income ? '+' : '−'}{money(t.amount, t.currency)}
                    </p>
                    {t.currency === 'EUR' && <p className="text-xs text-gray-400">≈ {money(t.amountRon)}</p>}
                </div>
                {actions}
            </div>
        </div>
    );
}
