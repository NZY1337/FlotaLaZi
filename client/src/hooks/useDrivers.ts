import { createDriver, deleteDriver, getDrivers, updateDriver, type DriverInput } from '../services/drivers';
import { useAuthedMutation, useAuthedQuery } from './useFleetApi';

const AFFECTED = ['drivers', 'documents', 'dashboard'];

export const useDrivers = () => {
    const { data: drivers = [], isLoading, isError } = useAuthedQuery(['drivers'], getDrivers);
    const create = useAuthedMutation((token, input: DriverInput) => createDriver(token, input), AFFECTED);
    const update = useAuthedMutation((token, { id, input }: { id: string; input: DriverInput }) => updateDriver(token, id, input), AFFECTED);
    const remove = useAuthedMutation((token, id: string) => deleteDriver(token, id), AFFECTED);
    return { drivers, isLoading, isError, create, update, remove };
};
