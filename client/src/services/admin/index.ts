import { apiFetch } from '../api';

export type AdminClient = {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    lastSeenAt: string;
    trucks: number;
    trailers: number;
    cars: number;
    drivers: number;
    documents: number;
    transactions: number;
    emailAlerts: boolean;
    accountType: 'FIRM' | 'PERSONAL';
};

export type AdminOverview = {
    totals: {
        users: number;
        newUsers7d: number;
        newUsers30d: number;
        activeUsers7d: number;
        trucks: number;
        trailers: number;
        cars: number;
        personalUsers: number;
        drivers: number;
        documents: number;
        transactions: number;
        alertsToday: number;
    };
    clients: AdminClient[];
};

export const getAdminOverview = (token: string) => apiFetch<AdminOverview>(token, '/admin/overview');
