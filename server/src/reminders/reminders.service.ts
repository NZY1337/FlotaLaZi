import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, Repository } from 'typeorm';
import { FleetDocument } from '../documents/entities/document.entity';
import { Vehicle, VehicleKind } from '../vehicles/entities/vehicle.entity';
import { FleetSettings } from '../settings/entities/fleet-settings.entity';
import { UserEntity } from '../user/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NodemailerService } from '../../services/nodemailer/nodemailer.service';
import { addDays, BUSINESS_TIME_ZONE, todayYmd } from '../fleet/dates';
import { expiryStatus, oilStatus, shouldAlertDocument, shouldAlertOil } from '../fleet/status';
import { Alert, alertLine, emailDigest, notificationType } from './digest';

const DEFAULT_SETTINGS = { oilAlertKm: 5000, emailAlerts: true };
const MAX_ALERT_DAYS = 365;
const TEST_COOLDOWN_MS = 60_000;

type OwnerBatch = { alerts: Alert[]; documentIds: string[]; vehicleIds: string[] };

/**
 * `scheduled`: the daily run — only threshold days, once per day (CLAUDE.md §7).
 * `test`: "send me my alerts now" — everything currently red/yellow for one
 * owner, ignoring thresholds and bookkeeping, so the morning run is unaffected.
 */
type Mode = 'scheduled' | 'test';

export type TestResult = {
    alerts: string[];
    email: { sent: boolean; to: string | null; error: string | null };
};

// Daily reminders: in-app notification per item + one email digest per owner.
// Bookkeeping columns make a re-run on the same day a no-op.
@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);
    private readonly lastTest = new Map<string, number>();

    constructor(
        @InjectRepository(FleetDocument) private readonly documents: Repository<FleetDocument>,
        @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
        @InjectRepository(FleetSettings) private readonly settings: Repository<FleetSettings>,
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
        private readonly notifications: NotificationsService,
        private readonly mailer: NodemailerService,
    ) { }

    @Cron('0 8 * * *', { name: 'fleet-reminders', timeZone: BUSINESS_TIME_ZONE })
    async handleCron() {
        try {
            const sent = await this.run(todayYmd());
            this.logger.log(`Reminders sent for ${sent} owner(s)`);
        } catch (error) {
            this.logger.error(`Reminder run failed: ${(error as Error).message}`, (error as Error).stack);
        }
    }

    /** Collects and sends all alerts due on `today`. Returns the number of owners notified. */
    async run(today: string): Promise<number> {
        const { batches, settingsByOwner } = await this.collect(today, 'scheduled');
        let notified = 0;
        for (const [ownerId, b] of batches) {
            try {
                await this.deliver(ownerId, b, settingsByOwner.get(ownerId), today, 'scheduled');
                notified++;
            } catch (error) {
                // One owner's failure (e.g. SMTP) must not block the others.
                this.logger.error(`Reminders for ${ownerId} failed: ${(error as Error).message}`);
            }
        }
        return notified;
    }

    /** Sends one owner everything that needs attention right now (Setări → "Trimite-mi alertele acum"). */
    async sendTest(ownerId: string, today: string = todayYmd()): Promise<TestResult> {
        const last = this.lastTest.get(ownerId);
        if (last && Date.now() - last < TEST_COOLDOWN_MS) {
            throw new HttpException('Ai trimis deja un test acum câteva secunde. Mai încearcă peste un minut.', HttpStatus.TOO_MANY_REQUESTS);
        }
        this.lastTest.set(ownerId, Date.now());

        const { batches, settingsByOwner } = await this.collect(today, 'test', ownerId);
        const batch = batches.get(ownerId);
        if (!batch) return { alerts: [], email: { sent: false, to: null, error: null } };
        const email = await this.deliver(ownerId, batch, settingsByOwner.get(ownerId), today, 'test');
        return { alerts: batch.alerts.map(alertLine), email };
    }

    private async collect(today: string, mode: Mode, ownerId?: string) {
        const batches = new Map<string, OwnerBatch>();
        const batch = (owner: string) => {
            if (!batches.has(owner)) batches.set(owner, { alerts: [], documentIds: [], vehicleIds: [] });
            return batches.get(owner)!;
        };

        // Scheduled runs only care about documents near a threshold day; a test shows
        // everything red/yellow, including documents expired long ago.
        const docWhere: FindOptionsWhere<FleetDocument> = mode === 'test'
            ? { ownerId }
            : { expiresOn: Between(addDays(today, -1), addDays(today, MAX_ALERT_DAYS)) };
        const docs = await this.documents.find({ where: docWhere, relations: { vehicle: true, driver: true }, order: { expiresOn: 'ASC' } });
        for (const d of docs) {
            const { daysLeft, level } = expiryStatus(d.expiresOn, d.alertDays, today);
            const due = mode === 'test' ? level !== 'green' : shouldAlertDocument(daysLeft, d.alertDays, d.lastAlertedOn, today);
            if (!due) continue;
            const b = batch(d.ownerId);
            b.alerts.push({ kind: 'document', type: d.type, subject: d.vehicle?.plate ?? d.driver?.name ?? 'Firmă', expiresOn: d.expiresOn, daysLeft });
            b.documentIds.push(d.id);
        }

        const trucks = await this.vehicles.find({ where: { kind: VehicleKind.TRUCK, ...(mode === 'test' ? { ownerId } : {}) }, order: { plate: 'ASC' } });
        const ownerIds = [...new Set([...trucks.map((t) => t.ownerId), ...(ownerId ? [ownerId] : [])])];
        const settingsRows = ownerIds.length ? await this.settings.findBy({ ownerId: In(ownerIds) }) : [];
        const settingsByOwner = new Map(settingsRows.map((s) => [s.ownerId, s]));
        for (const t of trucks) {
            const s = settingsByOwner.get(t.ownerId) ?? DEFAULT_SETTINGS;
            const oil = oilStatus(t, s.oilAlertKm, today);
            if (!oil.configured) continue;
            const due = mode === 'test' ? oil.level !== 'green' : shouldAlertOil(oil.level, t.lastOilAlertOn, today);
            if (!due) continue;
            const b = batch(t.ownerId);
            b.alerts.push({ kind: 'oil', plate: t.plate, kmLeft: oil.kmLeft, daysLeft: oil.daysLeft });
            b.vehicleIds.push(t.id);
        }

        return { batches, settingsByOwner };
    }

    private async deliver(ownerId: string, b: OwnerBatch, settings: FleetSettings | undefined, today: string, mode: Mode) {
        for (const alert of b.alerts) {
            await this.notifications.create(ownerId, { message: alertLine(alert), type: notificationType(alert) });
        }

        const email: TestResult['email'] = { sent: false, to: null, error: null };
        const emailAlerts = settings ? settings.emailAlerts : (await this.settings.findOneBy({ ownerId }))?.emailAlerts ?? true;
        // A test was explicitly asked for, so it emails even with daily email alerts off.
        if (emailAlerts || mode === 'test') {
            const user = await this.users.findOneBy({ id: ownerId });
            if (user?.email) {
                email.to = user.email;
                const { subject, text } = emailDigest(user.name, b.alerts, process.env.APP_URL ?? 'http://localhost:5173');
                try {
                    await this.mailer.sendText(user.email, subject, text);
                    email.sent = true;
                } catch (error) {
                    if (mode === 'scheduled') throw error;
                    // Report SMTP problems to the owner instead of failing the whole test.
                    email.error = (error as Error).message;
                    this.logger.warn(`Test email for ${ownerId} failed: ${email.error}`);
                }
            }
        }

        // Mark as handled only after delivery, so a failed run retries tomorrow's cron.
        // A test never touches the bookkeeping: the scheduled run must still go out.
        if (mode === 'scheduled') {
            if (b.documentIds.length) await this.documents.update({ id: In(b.documentIds) }, { lastAlertedOn: today });
            if (b.vehicleIds.length) await this.vehicles.update({ id: In(b.vehicleIds) }, { lastOilAlertOn: today });
        }
        return email;
    }
}
