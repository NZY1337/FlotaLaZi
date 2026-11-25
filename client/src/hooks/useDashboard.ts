import { getDashboard } from '../services/dashboard';
import { useAuthedQuery } from './useFleetApi';

export const useDashboard = () => {
    const { data: dashboard, isLoading, isError } = useAuthedQuery(['dashboard'], getDashboard);
    return { dashboard, isLoading, isError };
};
