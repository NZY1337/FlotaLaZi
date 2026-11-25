import { apiFetch, jsonBody } from '../api';

export type FleetSettings = {
    ownerId: string;
    eurRate: number;
    oilAlertKm: number;
    docAlertDays: number;
    emailAlerts: boolean;
};

export type SettingsInput = Partial<Omit<FleetSettings, 'ownerId'>>;

export const getSettings = (token: string) => apiFetch<FleetSettings>(token, '/settings');

export const updateSettings = (token: string, input: SettingsInput) =>
    apiFetch<FleetSettings>(token, '/settings', { method: 'PATCH', ...jsonBody(input) });
