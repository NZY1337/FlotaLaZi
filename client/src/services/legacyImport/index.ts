import { apiFetch, jsonBody } from '../api';

export type ImportResult = { vehicles: number; documents: number; transactions: number; skipped: number };

/** Sends the old app's JSON backup as-is; the backend validates and maps it. */
export const importLegacyBackup = (token: string, backup: unknown) =>
    apiFetch<ImportResult>(token, '/import/legacy', { method: 'POST', ...jsonBody(backup) });
