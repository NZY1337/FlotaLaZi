import { apiFetch, jsonBody } from '../api';

export type Driver = { id: string; name: string; phone: string; email: string; notes: string };
export type DriverInput = Partial<Omit<Driver, 'id'>>;

export const getDrivers = (token: string) => apiFetch<Driver[]>(token, '/drivers');

export const createDriver = (token: string, input: DriverInput) =>
    apiFetch<Driver>(token, '/drivers', { method: 'POST', ...jsonBody(input) });

export const updateDriver = (token: string, id: string, input: DriverInput) =>
    apiFetch<Driver>(token, `/drivers/${encodeURIComponent(id)}`, { method: 'PATCH', ...jsonBody(input) });

export const deleteDriver = (token: string, id: string) =>
    apiFetch<null>(token, `/drivers/${encodeURIComponent(id)}`, { method: 'DELETE' });
