import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Read-only numbers for the platform owner. Counts only: what a client earns,
// spends or keeps in a document stays out of this view.

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
        drivers: number;
        documents: number;
        transactions: number;
        alertsToday: number;
    };
    clients: AdminClient[];
};

const n = (v: unknown) => Number(v ?? 0);

@Injectable()
export class AdminService {
    constructor(private readonly db: DataSource) { }

    async overview(): Promise<AdminOverview> {
        // users."updatedAt" moves on every authenticated request
        // (UserSyncInterceptor), so it is the last time the client used the app.
        const rows: Record<string, unknown>[] = await this.db.query(`
            -- The columns are timestamps without time zone, written in the
            -- database's own zone: make them absolute here, so the result does
            -- not depend on the database and the server sharing a time zone.
            SELECT u.id, u.email, u.name, u.role,
                   u."createdAt" AT TIME ZONE current_setting('TimeZone') AS "createdAt",
                   u."updatedAt" AT TIME ZONE current_setting('TimeZone') AS "updatedAt",
                   (SELECT count(*) FROM vehicles v WHERE v."ownerId" = u.id AND v.kind = 'TRUCK')   AS trucks,
                   (SELECT count(*) FROM vehicles v WHERE v."ownerId" = u.id AND v.kind = 'TRAILER') AS trailers,
                   (SELECT count(*) FROM vehicles v WHERE v."ownerId" = u.id AND v.kind = 'CAR')     AS cars,
                   (SELECT count(*) FROM drivers d WHERE d."ownerId" = u.id)                         AS drivers,
                   (SELECT count(*) FROM documents d WHERE d."ownerId" = u.id)                       AS documents,
                   (SELECT count(*) FROM transactions t WHERE t."ownerId" = u.id)                    AS transactions,
                   COALESCE(s."emailAlerts", true)                                                   AS "emailAlerts",
                   COALESCE(s."accountType"::text, 'FIRM')                                           AS "accountType"
            FROM users u
            LEFT JOIN fleet_settings s ON s."ownerId" = u.id
            ORDER BY u."createdAt" DESC`);

        const clients: AdminClient[] = rows.map((r) => ({
            id: String(r.id),
            email: String(r.email),
            name: String(r.name ?? ''),
            role: String(r.role),
            createdAt: new Date(r.createdAt as string).toISOString(),
            lastSeenAt: new Date(r.updatedAt as string).toISOString(),
            trucks: n(r.trucks),
            trailers: n(r.trailers),
            cars: n(r.cars),
            drivers: n(r.drivers),
            documents: n(r.documents),
            transactions: n(r.transactions),
            emailAlerts: Boolean(r.emailAlerts),
            accountType: r.accountType === 'PERSONAL' ? 'PERSONAL' : 'FIRM',
        }));

        const now = Date.now();
        const within = (iso: string, days: number) => now - new Date(iso).getTime() <= days * 86_400_000;
        const sum = (key: 'trucks' | 'trailers' | 'drivers' | 'documents' | 'transactions') =>
            clients.reduce((a, c) => a + c[key], 0);

        // "Today" as the owner sees it: since midnight in Romania.
        const [{ alerts }] = await this.db.query(`
            SELECT count(*) AS alerts FROM notifications
            WHERE created_at AT TIME ZONE current_setting('TimeZone')
                  >= (date_trunc('day', now() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest')`);

        return {
            totals: {
                users: clients.length,
                newUsers7d: clients.filter((c) => within(c.createdAt, 7)).length,
                newUsers30d: clients.filter((c) => within(c.createdAt, 30)).length,
                activeUsers7d: clients.filter((c) => within(c.lastSeenAt, 7)).length,
                trucks: sum('trucks'),
                trailers: sum('trailers'),
                drivers: sum('drivers'),
                documents: sum('documents'),
                transactions: sum('transactions'),
                alertsToday: n(alerts),
            },
            clients,
        };
    }
}
