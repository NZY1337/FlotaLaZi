import { apiFetch, jsonBody } from '../api';
import type { Level } from '../vehicles';

export type FleetDocument = {
    id: string;
    vehicleId: string | null;
    driverId: string | null;
    type: string;
    expiresOn: string;
    alertDays: number;
    notes: string;
    // Computed by the backend:
    daysLeft: number;
    level: Level;
    subject: string;
};

export type DocumentInput = {
    vehicleId?: string | null;
    driverId?: string | null;
    type?: string;
    expiresOn?: string;
    alertDays?: number;
    notes?: string;
};

export const getDocuments = (token: string) => apiFetch<FleetDocument[]>(token, '/documents');

export const createDocument = (token: string, input: DocumentInput) =>
    apiFetch<FleetDocument>(token, '/documents', { method: 'POST', ...jsonBody(input) });

export const updateDocument = (token: string, id: string, input: DocumentInput) =>
    apiFetch<FleetDocument>(token, `/documents/${encodeURIComponent(id)}`, { method: 'PATCH', ...jsonBody(input) });

export const deleteDocument = (token: string, id: string) =>
    apiFetch<null>(token, `/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
