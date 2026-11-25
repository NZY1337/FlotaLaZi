import type { ReactNode } from 'react';
import { cardClasses } from './ui';

export default function StatCard({ label, value, sub, tone = 'neutral' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'neutral' | 'green' | 'red' }) {
    const color = tone === 'green' ? 'text-success-600 dark:text-success-500' : tone === 'red' ? 'text-error-600 dark:text-error-400' : 'text-gray-800 dark:text-white/90';
    return (
        <div className={`${cardClasses} p-5`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}
