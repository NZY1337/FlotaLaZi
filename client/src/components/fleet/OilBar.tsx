import { LEVEL_STYLES, formatDate, formatKm } from '../../helpers/fleet';
import type { OilStatus } from '../../services/vehicles';

export default function OilBar({ oil }: { oil: OilStatus }) {
    if (!oil.configured) return <p className="text-xs text-gray-400">Schimbul de ulei nu e configurat.</p>;
    const parts: string[] = [];
    if (oil.kmLeft != null) parts.push(oil.kmLeft <= 0 ? `depășit cu ${formatKm(-oil.kmLeft)}` : `mai sunt ${formatKm(oil.kmLeft)}`);
    if (oil.dueDate) parts.push(oil.daysLeft != null && oil.daysLeft < 0 ? `termen depășit (${formatDate(oil.dueDate)})` : `termen ${formatDate(oil.dueDate)}`);
    return (
        <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" role="progressbar" aria-valuenow={Math.round(oil.usedPct)} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${LEVEL_STYLES[oil.level].bar}`} style={{ width: `${oil.usedPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                🛢️ {parts.join(' · ')}{oil.nextKm != null ? ` · următorul la ${formatKm(oil.nextKm)}` : ''}
            </p>
        </div>
    );
}
