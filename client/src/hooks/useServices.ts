import { useQuery } from '@tanstack/react-query';
import { getServices, getServiceBySlug } from '../services/services';

export const useServices = () => {
    const { data: services = [], isLoading, isError } = useQuery({
        queryKey: ['services'],
        queryFn: getServices,
    });

    return { services, isLoading, isError };
};

// `service` is undefined while loading, null when the slug doesn't exist.
export const useService = (slug: string) => {
    const { data: service, isLoading, isError } = useQuery({
        queryKey: ['services', slug],
        queryFn: () => getServiceBySlug(slug),
        enabled: !!slug,
    });

    return { service, isLoading, isError };
};
