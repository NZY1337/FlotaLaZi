import { Link, useParams } from 'react-router';
import PageMeta from '../../../components/common/PageMeta';
import Alert from '../../../components/ui/alert/Alert';
import { ChevronLeftIcon } from '../../../icons';
import { useService } from '../../../hooks/useServices';
import ServicePrice from './ServicePrice';

const panelClasses = 'rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6';

export default function ServiceDetail() {
    const { slug = '' } = useParams();
    const { service, isLoading, isError } = useService(slug);

    return (
        <>
            <PageMeta
                title={`${service?.name ?? 'Serviciu'} - Streamloop`}
                description={service?.shortDescription ?? 'Detalii despre serviciu.'}
            />

            <Link
                to="/services"
                className="inline-flex items-center mb-6 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
                <ChevronLeftIcon className="size-5" />
                Toate serviciile
            </Link>

            {isLoading && (
                <div className={`${panelClasses} animate-pulse`} aria-hidden="true">
                    <div className="h-7 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800/60 mt-6" />
                    <div className="h-4 w-11/12 rounded bg-gray-100 dark:bg-gray-800/60 mt-2" />
                    <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800/60 mt-2" />
                </div>
            )}

            {isError && (
                <Alert variant="error" title="Eroare" message="Nu am putut încărca serviciul. Încearcă din nou mai târziu." />
            )}

            {/* null = the backend said 404; undefined = the query never ran (empty slug). */}
            {!isLoading && !isError && !service && (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-10 text-center">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Serviciul nu a fost găsit</h2>
                    <p className="text-xs text-gray-400 mt-1">Poate a fost retras sau linkul nu e corect.</p>
                </div>
            )}

            {service && (
                <div className={`${panelClasses} flex flex-col gap-8 md:flex-row md:justify-between`}>
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{service.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.shortDescription}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-6 whitespace-pre-line">
                            {service.description}
                        </p>
                    </div>
                    <div className="shrink-0">
                        <ServicePrice service={service} />
                    </div>
                </div>
            )}
        </>
    );
}
