import { apiFetch, jsonBody } from '../api';
import type { Currency } from '../transactions';

export type Level = 'red' | 'yellow' | 'green';
export type VehicleKind = 'TRUCK' | 'TRAILER' | 'CAR';
export type TrailerType = 'SEMIREMORCA' | 'REMORCA';

export type OilStatus = {
    configured: boolean;
    nextKm: number | null;
    kmLeft: number | null;
    dueDate: string | null;
    daysLeft: number | null;
    usedPct: number;
    level: Level;
};

type VehicleRef = { id: string; plate: string };

export type Vehicle = {
    id: string;
    kind: VehicleKind;
    plate: string;
    name: string;
    vin: string;
    notes: string;
    trailerType: TrailerType | null;
    attachedTrailerId: string | null;
    km: number | null;
    lastOilKm: number | null;
    oilIntervalKm: number | null;
    lastOilDate: string | null;
    oilIntervalMonths: number | null;
    // Computed by the backend:
    oil: OilStatus | null;
    attachedTrailer?: VehicleRef | null;
    coupledTruck?: VehicleRef | null;
};

export type VehicleInput = {
    kind?: VehicleKind;
    plate?: string;
    name?: string;
    vin?: string;
    notes?: string;
    trailerType?: TrailerType;
    attachedTrailerId?: string | null;
    km?: number | null;
    lastOilKm?: number | null;
    oilIntervalKm?: number | null;
    lastOilDate?: string | null;
    oilIntervalMonths?: number | null;
};

export type OilChangeInput = { km: number; date: string; cost?: number; currency?: Currency };

export const getVehicles = (token: string) => apiFetch<Vehicle[]>(token, '/vehicles');

export const createVehicle = (token: string, input: VehicleInput) =>
    apiFetch<Vehicle>(token, '/vehicles', { method: 'POST', ...jsonBody(input) });

export const updateVehicle = (token: string, id: string, input: VehicleInput) =>
    apiFetch<Vehicle>(token, `/vehicles/${encodeURIComponent(id)}`, { method: 'PATCH', ...jsonBody(input) });

export const deleteVehicle = (token: string, id: string) =>
    apiFetch<null>(token, `/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const recordOilChange = (token: string, id: string, input: OilChangeInput) =>
    apiFetch<Vehicle>(token, `/vehicles/${encodeURIComponent(id)}/oil-change`, { method: 'POST', ...jsonBody(input) });
