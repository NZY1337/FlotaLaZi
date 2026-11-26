import { createVehicle, deleteVehicle, getVehicles, recordOilChange, updateVehicle, type OilChangeInput, type VehicleInput } from '../services/vehicles';
import { useAuthedMutation, useAuthedQuery } from './useFleetApi';

// A vehicle change can affect documents (cascade), transactions (oil cost,
// detached vehicle) and the dashboard.
const AFFECTED = ['vehicles', 'documents', 'transactions', 'transactions-summary', 'dashboard'];

export const useVehicles = () => {
    const { data: vehicles = [], isLoading, isError } = useAuthedQuery(['vehicles'], getVehicles);
    const create = useAuthedMutation((token, input: VehicleInput) => createVehicle(token, input), AFFECTED);
    const update = useAuthedMutation((token, { id, input }: { id: string; input: VehicleInput }) => updateVehicle(token, id, input), AFFECTED);
    const remove = useAuthedMutation((token, id: string) => deleteVehicle(token, id), AFFECTED);
    const oilChange = useAuthedMutation((token, { id, input }: { id: string; input: OilChangeInput }) => recordOilChange(token, id, input), AFFECTED);

    return {
        vehicles,
        trucks: vehicles.filter((v) => v.kind === 'TRUCK'),
        trailers: vehicles.filter((v) => v.kind === 'TRAILER'),
        cars: vehicles.filter((v) => v.kind === 'CAR'),
        isLoading,
        isError,
        create,
        update,
        remove,
        oilChange,
    };
};
