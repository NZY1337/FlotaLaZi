import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
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
        expect(d.counts).toEqual({ trucks: 1, trailers: 1, drivers: 1 });
        expect(d.urgentDocumentCount).toBe(2);
        expect(d.oil).toEqual([expect.objectContaining({ plate: 'NT 08 RGT', level: 'green' })]);
        expect(d.recentExpenses[0]).toMatchObject({ category: 'Schimb ulei', vehiclePlate: 'NT 08 RGT' });
    });

    it('sends reminders once per day and only on threshold days', async () => {
        const reminders = app.get(RemindersService);
        const today = todayYmd();
        expect(await reminders.run(today)).toBe(1);
        const notes = (await as(A).get('/notifications').expect(200)).body;
        // Only the ITP at 7 days qualifies; the firm licence expired 3 days ago (not a threshold day).
        expect(notes.map((n: { message: string }) => n.message)).toEqual([expect.stringMatching(/^ITP — NT 08 RGT: expiră în 7 zile/)]);
        expect(sendText).toHaveBeenCalledTimes(1);
        expect(sendText.mock.calls[0][0]).toBe('1111@test.ro');

        expect(await reminders.run(today)).toBe(0);
        expect(sendText).toHaveBeenCalledTimes(1);
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
