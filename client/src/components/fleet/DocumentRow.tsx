import type { ReactNode } from 'react';
import { LevelBadge } from './ui';
import { LEVEL_STYLES, daysLeftLabel, formatDate } from '../../helpers/fleet';
import type { FleetDocument } from '../../services/documents';

export default function DocumentRow({ document: d, actions }: { document: FleetDocument; actions?: ReactNode }) {
    return (
        <div className={`flex flex-col gap-2 rounded-xl border border-gray-100 border-l-4 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between ${LEVEL_STYLES[d.level].border}`}>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {d.type} <span className="font-normal text-gray-500 dark:text-gray-400">— {d.subject}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Expiră: {formatDate(d.expiresOn)}{d.notes ? ` · ${d.notes}` : ''}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={d.level}>{d.level === 'green' ? `Valabil · ${d.daysLeft} zile` : daysLeftLabel(d.daysLeft)}</LevelBadge>
                {actions}
            </div>
        </div>
    );
}
