import { getAdminOverview } from '../services/admin';
import { useAuthedQuery } from './useFleetApi';

export const useAdminOverview = () => {
    const { data, isLoading, isError } = useAuthedQuery(['admin-overview'], getAdminOverview);
    return { overview: data, isLoading, isError };
};
