import { apiFetch } from '../api';
import type { FleetDocument } from '../documents';
import type { OilStatus } from '../vehicles';
import type { Summary, Transaction } from '../transactions';

export type Dashboard = {
    today: string;
    month: { from: string; to: string; totals: Summary['totals'] };
    documentAlerts: FleetDocument[];
    urgentDocumentCount: number;
    oil: ({ vehicleId: string; plate: string; km: number | null } & OilStatus)[];
    recentExpenses: (Transaction & { vehiclePlate: string | null })[];
    counts: { trucks: number; trailers: number; cars: number; drivers: number };
};

export const getDashboard = (token: string) => apiFetch<Dashboard>(token, '/dashboard');
