import type { Service } from '../../../services/services';
import { formatPrice } from '../../../helpers/helpers';

type ServicePriceProps = {
    service: Pick<Service, 'price' | 'currency' | 'billingType' | 'recurringPrice'>;
};

// Rendering only: shows what the backend returned. Recurring billing is
// monthly (CLAUDE.md §6 — "€49/month"); the provider owns the actual schedule.
const billingCaption = ({ billingType, recurringPrice, currency }: ServicePriceProps['service']) => {
    if (billingType === 'ONE_TIME') return 'plată unică';
    if (recurringPrice === null) return 'setup';
    return `setup + ${formatPrice(recurringPrice, currency)} / lună`;
};

export default function ServicePrice({ service }: ServicePriceProps) {
    return (
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {formatPrice(service.price, service.currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{billingCaption(service)}</p>
        </div>
    );
}
