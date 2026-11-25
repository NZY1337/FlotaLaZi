import { Link } from 'react-router';
import { Package } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import Alert from '../../../components/ui/alert/Alert';
import { useServices } from '../../../hooks/useServices';
import ServicePrice from './ServicePrice';

const cardClasses = 'rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5';

function ServiceCardSkeleton() {
    return (
        <div className={`${cardClasses} animate-pulse`} aria-hidden="true">
            <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800/60 mt-3" />
            <div className="h-4 w-4/5 rounded bg-gray-100 dark:bg-gray-800/60 mt-2" />
            <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-800 mt-8" />
        </div>
    );
}

export default function Services() {
    const { services, isLoading, isError } = useServices();

    return (
        <>
            <PageMeta
                title="Servicii - Streamloop"
                description="Automatizările pe care le poți comanda."
            />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Servicii</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Alege automatizarea de care ai nevoie.
                </p>
            </div>

            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ServiceCardSkeleton />
                    <ServiceCardSkeleton />
                    <ServiceCardSkeleton />
                </div>
            )}

            {isError && (
                <Alert variant="error" title="Eroare" message="Nu am putut încărca serviciile. Încearcă din nou mai târziu." />
            )}

            {!isLoading && !isError && services.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-10 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                        <Package className="w-6 h-6 text-brand-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Niciun serviciu disponibil momentan</h2>
                    <p className="text-xs text-gray-400 mt-1">Revino în curând.</p>
                </div>
            )}

            {services.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            to={`/services/${encodeURIComponent(service.slug)}`}
                            className={`${cardClasses} group flex flex-col gap-6 transition-colors hover:border-brand-300 dark:hover:border-brand-500/40`}
                        >
                            <div>
                                <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{service.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.shortDescription}</p>
                            </div>
                            <div className="mt-auto flex items-end justify-between gap-4">
                                <ServicePrice service={service} />
                                <span className="text-sm font-medium text-brand-500 group-hover:text-brand-600 dark:text-brand-400">
                                    Vezi detalii
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
