import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from '../src/http-setup';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SupabaseService } from '../services/supabase/supabase.service';
import { NodemailerService } from '../services/nodemailer/nodemailer.service';
import { RemindersService } from '../src/reminders/reminders.service';
import { addDays, todayYmd } from '../src/fleet/dates';

// End-to-end against a real, THROWAWAY Postgres with migrations applied.
// The suite TRUNCATES every fleet table, so it reads E2E_DATABASE_URL — never
// DATABASE_URL — to make pointing it at a real database a deliberate act.
// Supabase and SMTP are faked: the bearer token *is* the user id.
// Run: E2E_DATABASE_URL=postgres://… npm run test:e2e
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

const describeDb = process.env.E2E_DATABASE_URL ? describe : describe.skip;

describeDb('FlotaLaZi API (e2e)', () => {
    let app: INestApplication;
    let db: DataSource;
    const sendText = jest.fn().mockResolvedValue({});
    const sendWelcomeEmail = jest.fn().mockResolvedValue({});

    const as = (user: string) => ({
        get: (url: string) => request(app.getHttpServer()).get(`/api${url}`).set('Authorization', `Bearer ${user}`),
        post: (url: string, body?: object) => request(app.getHttpServer()).post(`/api${url}`).set('Authorization', `Bearer ${user}`).send(body),
        patch: (url: string, body: object) => request(app.getHttpServer()).patch(`/api${url}`).set('Authorization', `Bearer ${user}`).send(body),
        delete: (url: string) => request(app.getHttpServer()).delete(`/api${url}`).set('Authorization', `Bearer ${user}`),
    });

    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
        // Imported here so TypeORM reads the URL set above.
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- must load after the env var is set
        const { AppModule } = require('../src/app.module') as typeof import('../src/app.module');
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
            .overrideProvider(SupabaseService)
            .useValue({
                getUser: async (token: string) => ({
                    data: { user: { id: token, email: `${token.slice(0, 4)}@test.ro`, user_metadata: { full_name: `User ${token.slice(0, 1)}` } } },
                    error: null,
                }),
            })
            .overrideProvider(NodemailerService)
            .useValue({ sendWelcomeEmail, sendText })
            .compile();

        app = moduleRef.createNestApplication<NestExpressApplication>();
        configureApp(app as NestExpressApplication);
        await app.init();
        db = moduleRef.get(DataSource);
        await db.query(`TRUNCATE documents, transactions, drivers, fleet_settings, notifications, users CASCADE`);
        await db.query(`DELETE FROM vehicles`);
    });

    afterAll(async () => {
        await app?.close();
    });

    let trailerId: string;
    let truckId: string;

    it('rejects requests without a token', async () => {
        await request(app.getHttpServer()).get('/api/vehicles').expect(401);
    });

    it('sends the welcome email once, even when a new user\'s first requests race', async () => {
        const C = '33333333-3333-4333-8333-333333333333';
        sendWelcomeEmail.mockClear();
        await Promise.all([as(C).get('/settings'), as(C).get('/vehicles'), as(C).get('/dashboard')].map((r) => r.expect(200)));
        await as(C).get('/settings').expect(200);
        expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
        expect(sendWelcomeEmail.mock.calls[0][0]).toBe('3333@test.ro');
    });

    it('keeps serving requests when the welcome email fails', async () => {
        sendWelcomeEmail.mockRejectedValueOnce(new Error('SMTP timeout'));
        await as('44444444-4444-4444-8444-444444444444').get('/vehicles').expect(200);
    });

    it('creates default settings on first read, even when two first reads race', async () => {
        const [res, other] = await Promise.all([as(A).get('/settings'), as(A).get('/vehicles')]);
        expect(other.status).toBe(200);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ ownerId: A, eurRate: 4.97, oilAlertKm: 5000, docAlertDays: 30, emailAlerts: true });
    });

    it('creates a trailer and a truck coupled to it, ignoring fields of the other kind', async () => {
        const trailer = await as(A).post('/vehicles', { kind: 'TRAILER', plate: ' nt 83 sat ', trailerType: 'SEMIREMORCA', km: 5 }).expect(201);
        trailerId = trailer.body.id;
        expect(trailer.body).toMatchObject({ plate: 'NT 83 SAT', km: null });

        const truck = await as(A).post('/vehicles', {
            kind: 'TRUCK', plate: 'NT 08 RGT', name: 'Scania R500', trailerType: 'REMORCA', attachedTrailerId: trailerId,
            km: 412_000, lastOilKm: 380_000, oilIntervalKm: 50_000,
        }).expect(201);
        truckId = truck.body.id;
        expect(truck.body).toMatchObject({ attachedTrailerId: trailerId, trailerType: null });

        const list = await as(A).get('/vehicles').expect(200);
        expect(list.body.map((v: { kind: string }) => v.kind)).toEqual(['TRUCK', 'TRAILER']);
        expect(list.body[0]).toMatchObject({ attachedTrailer: { id: trailerId, plate: 'NT 83 SAT' }, oil: { kmLeft: 18_000, level: 'green' } });
        expect(list.body[1]).toMatchObject({ coupledTruck: { id: truckId, plate: 'NT 08 RGT' }, oil: null });
    });

    it('moves a trailer to the truck that couples it last', async () => {
        const truck2 = await as(A).post('/vehicles', { kind: 'TRUCK', plate: 'NT 09 ABC', attachedTrailerId: trailerId }).expect(201);
        const list = await as(A).get('/vehicles').expect(200);
        const first = list.body.find((v: { id: string }) => v.id === truckId);
        expect(first.attachedTrailerId).toBeNull();
        await as(A).patch(`/vehicles/${truckId}`, { attachedTrailerId: trailerId }).expect(200);
        await as(A).delete(`/vehicles/${truck2.body.id}`).expect(204);
    });

    it('hides one owner\'s data from another (404, not 403)', async () => {
        await as(B).patch(`/vehicles/${truckId}`, { km: 1 }).expect(404);
        await as(B).delete(`/vehicles/${truckId}`).expect(404);
        await as(B).post('/vehicles', { kind: 'TRUCK', plate: 'B 01 XYZ', attachedTrailerId: trailerId }).expect(404);
        await as(B).post('/documents', { vehicleId: truckId, type: 'ITP', expiresOn: '2027-01-01' }).expect(404);
        await as(B).post('/transactions', { type: 'EXPENSE', date: '2026-11-01', amount: 10, currency: 'RON', category: 'Altele', vehicleId: truckId }).expect(404);
        expect((await as(B).get('/vehicles').expect(200)).body).toEqual([]);
    });

    it('validates input', async () => {
        await as(A).post('/vehicles', { kind: 'BUS', plate: 'X' }).expect(400);
        await as(A).post('/documents', { type: 'ITP', expiresOn: '2026-02-30' }).expect(400);
        await as(A).post('/transactions', { type: 'EXPENSE', date: '2026-11-01', amount: 0, currency: 'USD', category: 'x' }).expect(400);
        await as(A).patch('/vehicles/not-a-uuid', { km: 1 }).expect(400);
    });

    it('lists documents with their status and refuses vehicle + driver together', async () => {
        const today = todayYmd();
        const driver = await as(A).post('/drivers', { name: 'Ion Popescu', phone: '0722' }).expect(201);
        await as(A).post('/documents', { vehicleId: truckId, type: 'ITP', expiresOn: addDays(today, 7) }).expect(201);
        await as(A).post('/documents', { driverId: driver.body.id, type: 'Card tahograf', expiresOn: addDays(today, 200) }).expect(201);
        await as(A).post('/documents', { type: 'Licență Transport', expiresOn: addDays(today, -3), alertDays: 10 }).expect(201);
        await as(A).post('/documents', { vehicleId: truckId, driverId: driver.body.id, type: 'X', expiresOn: today }).expect(400);

        const docs = (await as(A).get('/documents').expect(200)).body;
        expect(docs.map((d: { subject: string; level: string; daysLeft: number }) => [d.subject, d.level, d.daysLeft])).toEqual([
            ['Firmă', 'red', -3],
            ['NT 08 RGT', 'yellow', 7],
            ['Ion Popescu', 'green', 200],
        ]);
        expect(docs[1].alertDays).toBe(30);
    });

    it('converts EUR at the rate captured when the transaction is saved', async () => {
        const income = await as(A).post('/transactions', { type: 'INCOME', date: '2026-11-02', amount: 1500, currency: 'EUR', category: 'Transport / Cursă', vehicleId: truckId }).expect(201);
        expect(income.body).toMatchObject({ amount: 150_000, eurRate: 4.97, amountRon: 745_500 });

        await as(A).patch('/settings', { eurRate: 5.1 }).expect(200);
        await as(A).post('/transactions', { type: 'EXPENSE', date: '2026-11-03', amount: 100, currency: 'EUR', category: 'Taxe drum / Rovinietă', vehicleId: truckId }).expect(201);
        await as(A).post('/transactions', { type: 'EXPENSE', date: '2026-10-20', amount: 812.4, currency: 'RON', category: 'Combustibil', liters: 120 }).expect(201);

        const s = (await as(A).get(`/transactions/summary?from=2026-11-01&to=2026-11-30`).expect(200)).body;
        expect(s.totals).toMatchObject({ income: 745_500, expense: 51_000, profit: 694_500 });
        expect(s.byVehicle).toEqual([{ vehicleId: truckId, income: 745_500, expense: 51_000, profit: 694_500 }]);

        const edited = await as(A).patch(`/transactions/${income.body.id}`, { amount: 1000 }).expect(200);
        expect(edited.body).toMatchObject({ amount: 100_000, eurRate: 4.97, amountRon: 497_000 });

        await as(A).get('/transactions/summary?from=2026-12-01&to=2026-11-01').expect(400);
        expect((await as(A).get('/transactions?type=EXPENSE').expect(200)).body).toHaveLength(2);
    });

    it('records an oil change and its cost as an expense', async () => {
        await as(A).post(`/vehicles/${trailerId}/oil-change`, { km: 1, date: '2026-11-10' }).expect(400);
        const truck = await as(A).post(`/vehicles/${truckId}/oil-change`, { km: 415_000, date: '2026-11-10', cost: 2500 }).expect(201);
        expect(truck.body).toMatchObject({ km: 415_000, lastOilKm: 415_000, lastOilDate: '2026-11-10' });
        const oil = (await as(A).get('/transactions?from=2026-11-10&to=2026-11-10').expect(200)).body;
        expect(oil).toEqual([expect.objectContaining({ category: 'Schimb ulei', amount: 250_000, currency: 'RON', vehicleId: truckId })]);
    });

    it('serves the dashboard', async () => {
        const d = (await as(A).get('/dashboard').expect(200)).body;
        expect(d.counts).toEqual({ trucks: 1, trailers: 1, cars: 0, drivers: 1 });
        expect(d.urgentDocumentCount).toBe(2);
        expect(d.oil).toEqual([expect.objectContaining({ plate: 'NT 08 RGT', level: 'green' })]);
        expect(d.recentExpenses[0]).toMatchObject({ category: 'Schimb ulei', vehiclePlate: 'NT 08 RGT' });
    });

    it('sends reminders once per day: first alert in the window, then threshold days, then weekly while expired', async () => {
        const reminders = app.get(RemindersService);
        const today = todayYmd();
        expect(await reminders.run(today)).toBe(1);
        const notes = (await as(A).get('/notifications').expect(200)).body;
        // ITP at 7 days and the firm licence added already expired (never alerted: caught up at once);
        // the tachograph card at 200 days is outside its window.
        expect(notes.map((n: { message: string }) => n.message).sort()).toEqual([
            expect.stringMatching(/^ITP — NT 08 RGT: expiră în 7 zile/),
            expect.stringMatching(/^Licență Transport — Firmă: a expirat \(3 zile\)/),
        ]);
        expect(sendText).toHaveBeenCalledTimes(1);
        expect(sendText.mock.calls[0][0]).toBe('1111@test.ro');

        // Same day again: nothing. Next day (6 days left, licence −4): nothing. A week later: the licence again.
        expect(await reminders.run(today)).toBe(0);
        expect(await reminders.run(addDays(today, 1))).toBe(0);
        expect(await reminders.run(addDays(today, 6))).toBe(1);
        expect(sendText).toHaveBeenCalledTimes(2);
        expect(sendText.mock.calls[1][1]).toMatch(/^FlotaLaZi: ITP — NT 08 RGT: expiră mâine/);
        // Back to today, for the tests below.
        await db.query(`UPDATE documents SET "lastAlertedOn" = $1 WHERE "lastAlertedOn" > $1`, [today]);
    });

    it('sends a test digest of everything red/yellow on demand, without touching the daily bookkeeping', async () => {
        sendText.mockClear();
        const res = await as(A).post('/reminders/test').expect(200);
        // Unlike the scheduled run, the test includes the licence expired 3 days ago.
        expect(res.body.alerts).toEqual([
            expect.stringMatching(/^Licență Transport — Firmă: a expirat \(3 zile\)/),
            expect.stringMatching(/^ITP — NT 08 RGT: expiră în 7 zile/),
        ]);
        expect(res.body.email).toEqual({ sent: true, to: '1111@test.ro', error: null });
        expect(sendText).toHaveBeenCalledTimes(1);

        // Rate-limited per owner.
        await as(A).post('/reminders/test').expect(429);
        // Bookkeeping untouched: the daily run for today was already done and stays done.
        const reminders = app.get(RemindersService);
        expect(await reminders.run(todayYmd())).toBe(0);
        // Another owner with nothing due gets an empty result and no email.
        expect((await as(B).post('/reminders/test').expect(200)).body).toEqual({ alerts: [], email: { sent: false, to: null, error: null } });
        expect(sendText).toHaveBeenCalledTimes(1);
    });

    it('reports an SMTP failure in the test result instead of failing', async () => {
        sendText.mockRejectedValueOnce(new Error('Invalid login: 535 BadCredentials'));
        const reminders = app.get(RemindersService);
        // Reset the per-owner cooldown so this second test can run immediately.
        (reminders as unknown as { lastTest: Map<string, number> }).lastTest.clear();
        const res = await reminders.sendTest(A, todayYmd());
        expect(res.email).toEqual({ sent: false, to: '1111@test.ro', error: 'Invalid login: 535 BadCredentials' });
        expect(res.alerts).toHaveLength(2);
    });

    it('imports a legacy backup into an empty account only', async () => {
        const backup = {
            settings: { eurRate: 4.98 },
            trucks: [{ id: 'tk1', plate: 'BV 10 TIR', trailerId: 'tr1', km: 100 }],
            trailers: [{ id: 'tr1', plate: 'BV 11 REM', kind: 'Semiremorcă', itpDate: '2027-03-01' }],
            docs: [{ id: 'd1', vehicleId: 'tk1', type: 'RCA', expiry: '2027-02-01' }],
            txs: [{ id: 'x1', type: 'expense', date: '2026-11-01', amount: 10, currency: 'EUR', category: 'Altele', vehicleId: 'tk1' }],
        };
        const res = await as(B).post('/import/legacy', backup).expect(201);
        expect(res.body).toEqual({ vehicles: 2, documents: 2, transactions: 1, skipped: 0 });
        const vehicles = (await as(B).get('/vehicles').expect(200)).body;
        expect(vehicles[0]).toMatchObject({ plate: 'BV 10 TIR', attachedTrailer: { plate: 'BV 11 REM' } });
        expect((await as(B).get('/settings').expect(200)).body.eurRate).toBe(4.98);

        await as(B).post('/import/legacy', backup).expect(409);
        await as(A).post('/import/legacy', backup).expect(409);
    });

    it('totals match an independent recount: 120 random transactions, two EUR rates', async () => {
        // A separate owner so the other tests' data does not mix in.
        const C = '55555555-5555-4555-8555-555555555555';
        const today = todayYmd();
        const firstOfMonth = `${today.slice(0, 8)}01`;
        const dates = [firstOfMonth, today, addDays(firstOfMonth, -1), addDays(firstOfMonth, -20), addDays(firstOfMonth, -45)];
        const categories = ['Combustibil', 'Reparații', 'Salarii', 'Taxe drum / Rovinietă'];

        await as(C).patch('/settings', { eurRate: 4.9765 }).expect(200);
        const t1 = (await as(C).post('/vehicles', { kind: 'TRUCK', plate: 'CC 01 AAA' }).expect(201)).body.id;
        const t2 = (await as(C).post('/vehicles', { kind: 'TRUCK', plate: 'CC 02 BBB' }).expect(201)).body.id;
        const vehicles = [t1, t2, null];

        // Deterministic pseudo-random sequence, so a failure can be replayed.
        let seed = 20261125;
        const rand = (n: number) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % n; };

        type Sent = { type: 'INCOME' | 'EXPENSE'; date: string; cents: number; currency: 'RON' | 'EUR'; rate10k: number; category: string; vehicleId: string | null };
        const sent: Sent[] = [];
        for (let i = 0; i < 120; i++) {
            if (i === 60) await as(C).patch('/settings', { eurRate: 5.0123 }).expect(200);
            const rate10k = i < 60 ? 49765 : 50123;
            const tx: Sent = {
                type: rand(3) === 0 ? 'INCOME' : 'EXPENSE',
                date: dates[rand(dates.length)],
                cents: 1 + rand(5_000_000),           // 0.01 … 50,000.00
                currency: rand(4) === 0 ? 'EUR' : 'RON',
                rate10k,
                category: categories[rand(categories.length)],
                vehicleId: vehicles[rand(vehicles.length)],
            };
            if (i === 0) { tx.cents = 13000; tx.currency = 'EUR'; }   // the 646.945 RON half
            sent.push(tx);
            await as(C).post('/transactions', {
                type: tx.type, date: tx.date, amount: tx.cents / 100, currency: tx.currency,
                category: tx.category, vehicleId: tx.vehicleId,
            }).expect(201);
        }

        // Recount with integer math only, from what was sent.
        const ron = (t: Sent) => (t.currency === 'EUR' ? Math.floor((t.cents * t.rate10k + 5000) / 10000) : t.cents);
        const sum = (rows: Sent[], type: Sent['type']) => rows.filter((t) => t.type === type).reduce((a, t) => a + ron(t), 0);
        const expectTotals = (rows: Sent[]) => ({ income: sum(rows, 'INCOME'), expense: sum(rows, 'EXPENSE'), profit: sum(rows, 'INCOME') - sum(rows, 'EXPENSE') });

        // 1. Every stored row: amount and amountRon exactly as recounted.
        const listed = (await as(C).get('/transactions').expect(200)).body as { amount: number; amountRon: number }[];
        expect(listed).toHaveLength(120);
        expect(listed.reduce((a, t) => a + t.amount, 0)).toBe(sent.reduce((a, t) => a + t.cents, 0));
        expect(listed.reduce((a, t) => a + t.amountRon, 0)).toBe(sent.reduce((a, t) => a + ron(t), 0));
        const half = listed.find((t) => t.amount === 13000 && t.amountRon === 64695);
        expect(half).toBeDefined();

        // 2. Financiar over all time: totals, per truck, per category, per month, per currency.
        const all = (await as(C).get('/transactions/summary').expect(200)).body;
        expect(all.totals).toMatchObject(expectTotals(sent));
        for (const v of vehicles) {
            expect(all.byVehicle.find((r: { vehicleId: string | null }) => r.vehicleId === v)).toMatchObject(expectTotals(sent.filter((t) => t.vehicleId === v)));
        }
        for (const c of categories) {
            const expense = sum(sent.filter((t) => t.category === c), 'EXPENSE');
            if (expense) expect(all.byCategory.find((r: { category: string }) => r.category === c).expense).toBe(expense);
        }
        for (const m of new Set(sent.map((t) => t.date.slice(0, 7)))) {
            expect(all.byMonth.find((r: { month: string }) => r.month === m)).toMatchObject(expectTotals(sent.filter((t) => t.date.startsWith(m))));
        }
        for (const cur of ['RON', 'EUR'] as const) {
            const rows = sent.filter((t) => t.currency === cur);
            const native = (type: Sent['type']) => rows.filter((t) => t.type === type).reduce((a, t) => a + t.cents, 0);
            expect(all.totals.byCurrency[cur]).toEqual({ income: native('INCOME'), expense: native('EXPENSE') });
        }

        // 3. A period and one truck, as the Financiar filters send them.
        const from = addDays(firstOfMonth, -31);
        const period = (await as(C).get(`/transactions/summary?from=${from}&to=${today}&vehicleId=${t1}`).expect(200)).body;
        expect(period.totals).toMatchObject(expectTotals(sent.filter((t) => t.vehicleId === t1 && t.date >= from && t.date <= today)));

        // 4. The dashboard's "this month" equals the same recount.
        const dash = (await as(C).get('/dashboard').expect(200)).body;
        expect(dash.month.totals).toMatchObject(expectTotals(sent.filter((t) => t.date >= firstOfMonth && t.date <= today)));

        // 5. Straight from the database, bypassing the app's own summing.
        const [db1] = await db.query(
            `SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN "amountRon" END), 0)::int AS income,
                    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN "amountRon" END), 0)::int AS expense
             FROM transactions WHERE "ownerId" = $1`, [C]);
        expect({ income: db1.income, expense: db1.expense }).toEqual({ income: all.totals.income, expense: all.totals.expense });
    });

    it('refuses amounts too large to store, instead of failing with a server error', async () => {
        const D = '66666666-6666-4666-8666-666666666666';
        await as(D).patch('/settings', { eurRate: 20 }).expect(200);
        await as(D).post('/transactions', { type: 'INCOME', date: todayYmd(), amount: 1_000_000, currency: 'EUR', category: 'Altele (venit)' }).expect(201);
        await as(D).post('/transactions', { type: 'INCOME', date: todayYmd(), amount: 1_000_000.01, currency: 'EUR', category: 'Altele (venit)' }).expect(400);
        await as(D).patch('/settings', { eurRate: 25 }).expect(400);
        const [row] = (await as(D).get('/transactions').expect(200)).body;
        expect(row.amountRon).toBe(2_000_000_000);
    });

    it('admin overview: 404 for clients, counts per client for the admin, no money', async () => {
        const ADMIN = '77777777-7777-4777-8777-777777777777';
        const E = '88888888-8888-4888-8888-888888888888';

        // A client cannot see that the route exists.
        await as(E).get('/admin/overview').expect(404);
        await as(ADMIN).get('/settings').expect(200);           // the account exists, as a plain user
        await as(ADMIN).get('/admin/overview').expect(404);
        await db.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [ADMIN]);

        // E: 1 truck, 1 trailer, 1 driver, 2 documents, 3 transactions, alerts off.
        await as(E).patch('/settings', { emailAlerts: false }).expect(200);
        const truck = (await as(E).post('/vehicles', { kind: 'TRUCK', plate: 'EE 01 AAA' }).expect(201)).body.id;
        await as(E).post('/vehicles', { kind: 'TRAILER', plate: 'EE 02 BBB' }).expect(201);
        await as(E).post('/drivers', { name: 'Ion' }).expect(201);
        await as(E).post('/documents', { type: 'ITP', expiresOn: addDays(todayYmd(), 40), alertDays: 30, vehicleId: truck }).expect(201);
        await as(E).post('/documents', { type: 'Licență Transport', expiresOn: addDays(todayYmd(), 200), alertDays: 30 }).expect(201);
        for (const amount of [100, 200, 300]) {
            await as(E).post('/transactions', { type: 'EXPENSE', date: todayYmd(), amount, currency: 'RON', category: 'Altele' }).expect(201);
        }

        const body = (await as(ADMIN).get('/admin/overview').expect(200)).body;
        const e = body.clients.find((c: { id: string }) => c.id === E);
        expect(e).toMatchObject({ email: '8888@test.ro', trucks: 1, trailers: 1, cars: 0, drivers: 1, documents: 2, transactions: 3, emailAlerts: false, accountType: 'FIRM' });
        expect(Date.now() - new Date(e.lastSeenAt).getTime()).toBeLessThan(60_000);
        // Counts only: no amounts, plates or document contents leave this endpoint.
        expect(JSON.stringify(body)).not.toMatch(/amount|EE 01 AAA|Licență/);

        const [db1] = await db.query(`SELECT (SELECT count(*) FROM users)::int AS users,
            (SELECT count(*) FROM vehicles WHERE kind = 'TRUCK')::int AS trucks,
            (SELECT count(*) FROM transactions)::int AS transactions`);
        expect(body.totals).toMatchObject({ users: db1.users, trucks: db1.trucks, transactions: db1.transactions });
        expect(body.totals.activeUsers7d).toBeGreaterThanOrEqual(2);
    });

    it('no longer serves another user\'s profile by id', async () => {
        await request(app.getHttpServer()).get(`/api/user/${A}`).expect(404);
        await as(B).get(`/user/${A}`).expect(404);
    });

    it('isolates owners on every route: another owner gets 404 and changes nothing', async () => {
        const X = '99999999-9999-4999-8999-999999999991';
        const Y = '99999999-9999-4999-8999-999999999992';
        const day = todayYmd();

        // X's fleet: one of everything.
        const trailer = (await as(X).post('/vehicles', { kind: 'TRAILER', plate: 'XX 01 TRL' }).expect(201)).body.id;
        const truck = (await as(X).post('/vehicles', { kind: 'TRUCK', plate: 'XX 02 TRK', km: 1000, attachedTrailerId: trailer }).expect(201)).body.id;
        const driver = (await as(X).post('/drivers', { name: 'Șofer X' }).expect(201)).body.id;
        const docV = (await as(X).post('/documents', { type: 'ITP', expiresOn: addDays(day, 5), alertDays: 30, vehicleId: truck }).expect(201)).body.id;
        const docD = (await as(X).post('/documents', { type: 'Permis de conducere', expiresOn: addDays(day, 5), alertDays: 30, driverId: driver }).expect(201)).body.id;
        const tx = (await as(X).post('/transactions', { type: 'INCOME', date: day, amount: 1000, currency: 'RON', category: 'Transport / Cursă', vehicleId: truck }).expect(201)).body.id;
        const note = (await as(X).post('/notifications', { type: 'info', message: 'pentru X' }).expect(201)).body.id;
        const snapshot = async () => ({
            vehicles: (await as(X).get('/vehicles').expect(200)).body,
            drivers: (await as(X).get('/drivers').expect(200)).body,
            documents: (await as(X).get('/documents').expect(200)).body,
            transactions: (await as(X).get('/transactions').expect(200)).body,
            notifications: (await as(X).get('/notifications').expect(200)).body,
        });
        const before = await snapshot();

        // Y's own truck and driver, to try attaching X's things to.
        const yTruck = (await as(Y).post('/vehicles', { kind: 'TRUCK', plate: 'YY 01 TRK' }).expect(201)).body.id;
        const yDriver = (await as(Y).post('/drivers', { name: 'Șofer Y' }).expect(201)).body.id;
        const yDoc = (await as(Y).post('/documents', { type: 'ITP', expiresOn: addDays(day, 50), alertDays: 30, vehicleId: yTruck }).expect(201)).body.id;
        const yTx = (await as(Y).post('/transactions', { type: 'EXPENSE', date: day, amount: 5, currency: 'RON', category: 'Altele' }).expect(201)).body.id;

        // 1. Y cannot read, change or delete any of X's records.
        await as(Y).patch(`/vehicles/${truck}`, { km: 1 }).expect(404);
        await as(Y).patch(`/vehicles/${trailer}`, { plate: 'HACK' }).expect(404);
        await as(Y).post(`/vehicles/${truck}/oil-change`, { km: 2000, date: day }).expect(404);
        await as(Y).delete(`/vehicles/${truck}`).expect(404);
        await as(Y).delete(`/vehicles/${trailer}`).expect(404);
        await as(Y).patch(`/drivers/${driver}`, { name: 'HACK' }).expect(404);
        await as(Y).delete(`/drivers/${driver}`).expect(404);
        await as(Y).patch(`/documents/${docV}`, { expiresOn: addDays(day, 900) }).expect(404);
        await as(Y).delete(`/documents/${docV}`).expect(404);
        await as(Y).delete(`/documents/${docD}`).expect(404);
        await as(Y).patch(`/transactions/${tx}`, { amount: 1 }).expect(404);
        await as(Y).delete(`/transactions/${tx}`).expect(404);
        await as(Y).patch(`/notifications/${note}/read`, {}).expect(404);
        await as(Y).delete(`/notifications/${note}`).expect(404);

        // 2. Y cannot point its own records at X's ids.
        await as(Y).post('/vehicles', { kind: 'TRUCK', plate: 'YY 02 TRK', attachedTrailerId: trailer }).expect(404);
        await as(Y).patch(`/vehicles/${yTruck}`, { attachedTrailerId: trailer }).expect(404);
        await as(Y).post('/documents', { type: 'ITP', expiresOn: addDays(day, 5), vehicleId: truck }).expect(404);
        await as(Y).post('/documents', { type: 'Permis de conducere', expiresOn: addDays(day, 5), driverId: driver }).expect(404);
        await as(Y).patch(`/documents/${yDoc}`, { vehicleId: truck }).expect(404);
        await as(Y).post('/transactions', { type: 'EXPENSE', date: day, amount: 5, currency: 'RON', category: 'Altele', vehicleId: truck }).expect(404);
        await as(Y).patch(`/transactions/${yTx}`, { vehicleId: truck }).expect(404);

        // 3. Y's lists, filters, summary and dashboard show nothing of X.
        const yVehicles = (await as(Y).get('/vehicles').expect(200)).body;
        expect(yVehicles.map((v: { id: string }) => v.id)).toEqual([yTruck]);
        expect((await as(Y).get('/drivers').expect(200)).body.map((d: { id: string }) => d.id)).toEqual([yDriver]);
        expect((await as(Y).get('/documents').expect(200)).body.map((d: { id: string }) => d.id)).toEqual([yDoc]);
        expect((await as(Y).get(`/transactions?vehicleId=${truck}`).expect(200)).body).toEqual([]);
        expect((await as(Y).get(`/transactions/summary?vehicleId=${truck}`).expect(200)).body.totals).toMatchObject({ income: 0, expense: 0 });
        expect((await as(Y).get('/notifications').expect(200)).body).toEqual([]);
        expect(JSON.stringify((await as(Y).get('/dashboard').expect(200)).body)).not.toMatch(/XX 0|Șofer X/);

        // 4. Ids that are not even UUIDs: refused (400 or 404), never a server error.
        for (const [method, url] of [
            ['patch', '/vehicles/nu-e-un-id'], ['delete', '/vehicles/nu-e-un-id'], ['post', '/vehicles/nu-e-un-id/oil-change'],
            ['patch', '/drivers/nu-e-un-id'], ['delete', '/drivers/nu-e-un-id'],
            ['patch', '/documents/nu-e-un-id'], ['delete', '/documents/nu-e-un-id'],
            ['patch', '/transactions/nu-e-un-id'], ['delete', '/transactions/nu-e-un-id'],
            ['patch', '/notifications/nu-e-un-id/read'], ['delete', '/notifications/nu-e-un-id'],
        ] as const) {
            const res = await (method === 'delete' ? as(Y).delete(url) : method === 'post' ? as(Y).post(url, { km: 1, date: day }) : as(Y).patch(url, { km: 1 }));
            expect([url, [400, 404].includes(res.status)]).toEqual([url, true]);
        }

        // 5. And X's data is exactly as it was.
        expect(await snapshot()).toEqual(before);
    });

    it('only lets the app\'s own sites call the API from a browser, with security headers', async () => {
        const preflight = (origin: string) => request(app.getHttpServer()).options('/api/vehicles')
            .set('Origin', origin).set('Access-Control-Request-Method', 'GET');
        expect((await preflight('https://www.flotalazi.ro')).headers['access-control-allow-origin']).toBe('https://www.flotalazi.ro');
        expect((await preflight('http://localhost:5173')).headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect((await preflight('https://evil.example')).headers['access-control-allow-origin']).toBeUndefined();

        const res = await as(A).get('/settings').expect(200);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('rate-limits per session: a script cannot hammer the old-backup import', async () => {
        const Z = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
        for (let i = 0; i < 5; i++) {
            const res = await as(Z).post('/import/legacy', {});
            expect(res.status).not.toBe(429);
        }
        await as(Z).post('/import/legacy', {}).expect(429);
        // Another account is not affected by Z's limit.
        expect((await as('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb').post('/import/legacy', {})).status).not.toBe(429);
    });

    it('a personal account: chooses its type, keeps cars with km and oil, gets their oil alerts', async () => {
        const P = '77777777-7777-4777-8777-777777777777';
        expect((await as(P).get('/settings').expect(200)).body.accountType).toBeNull();
        await as(P).patch('/settings', { accountType: 'SOMETHING' }).expect(400);
        expect((await as(P).patch('/settings', { accountType: 'PERSONAL' }).expect(200)).body.accountType).toBe('PERSONAL');

        // The account's own documents are "Personal", not "Firmă", in the app and in the alerts.
        await as(P).post('/documents', { type: 'Permis de conducere', expiresOn: addDays(todayYmd(), 5) }).expect(201);
        expect((await as(P).get('/documents').expect(200)).body[0]).toMatchObject({ type: 'Permis de conducere', subject: 'Personal' });

        // A trailer id on a car is ignored: only trucks pull trailers.
        const trailer = (await as(P).post('/vehicles', { kind: 'TRAILER', plate: 'B 99 REM' }).expect(201)).body.id;
        const car = (await as(P).post('/vehicles', { kind: 'CAR', plate: 'b 123 abc', km: 50_000, lastOilKm: 40_000, oilIntervalKm: 15_000, attachedTrailerId: trailer }).expect(201)).body;
        expect(car).toMatchObject({ kind: 'CAR', plate: 'B 123 ABC', attachedTrailerId: null, trailerType: null });

        const listed = (await as(P).get('/vehicles').expect(200)).body.find((v: { id: string }) => v.id === car.id);
        expect(listed.oil).toMatchObject({ configured: true, kmLeft: 5_000, level: 'yellow' });
        const d = (await as(P).get('/dashboard').expect(200)).body;
        expect(d.counts).toEqual({ trucks: 0, trailers: 1, cars: 1, drivers: 0 });
        expect(d.oil).toEqual([expect.objectContaining({ plate: 'B 123 ABC', level: 'yellow' })]);

        // Cars are in the oil reminders like trucks.
        const test = (await as(P).post('/reminders/test').expect(200)).body;
        expect(test.alerts).toEqual([
            expect.stringMatching(/^Permis de conducere — Personal: expiră în 5 zile/),
            expect.stringMatching(/^Schimb ulei — B 123 ABC: mai sunt 5000 km/),
        ]);

        await as(P).post(`/vehicles/${car.id}/oil-change`, { km: 51_000, date: todayYmd() }).expect(201);
        await as(P).post(`/vehicles/${trailer}/oil-change`, { km: 1, date: todayYmd() }).expect(400);
        expect((await as(P).get('/dashboard').expect(200)).body.oil[0]).toMatchObject({ level: 'green', kmLeft: 15_000 });
    });

    it('deleting a truck removes its documents and keeps its transactions', async () => {
        await as(A).delete(`/vehicles/${truckId}`).expect(204);
        const docs = (await as(A).get('/documents').expect(200)).body;
        expect(docs.map((d: { type: string }) => d.type).sort()).toEqual(['Card tahograf', 'Licență Transport']);
        const txs = (await as(A).get('/transactions').expect(200)).body;
        expect(txs).toHaveLength(4);
        expect(txs.every((t: { vehicleId: string | null }) => t.vehicleId === null)).toBe(true);
        const trailer = (await as(A).get('/vehicles').expect(200)).body[0];
        expect(trailer).toMatchObject({ id: trailerId, coupledTruck: null });
    });
});
