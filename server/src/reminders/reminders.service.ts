import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
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

type OwnerBatch = { alerts: Alert[]; documentIds: string[]; vehicleIds: string[] };

// Daily reminders (CLAUDE.md §7): in-app notification per item + one email
// digest per owner. Bookkeeping columns make a re-run on the same day a no-op.
@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

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
        const batches = new Map<string, OwnerBatch>();
        const batch = (ownerId: string) => {
            if (!batches.has(ownerId)) batches.set(ownerId, { alerts: [], documentIds: [], vehicleIds: [] });
            return batches.get(ownerId)!;
        };

        const docs = await this.documents.find({
            where: { expiresOn: Between(addDays(today, -1), addDays(today, MAX_ALERT_DAYS)) },
            relations: { vehicle: true, driver: true },
        });
        for (const d of docs) {
            const { daysLeft } = expiryStatus(d.expiresOn, d.alertDays, today);
            if (!shouldAlertDocument(daysLeft, d.alertDays, d.lastAlertedOn, today)) continue;
            const b = batch(d.ownerId);
            b.alerts.push({ kind: 'document', type: d.type, subject: d.vehicle?.plate ?? d.driver?.name ?? 'Firmă', expiresOn: d.expiresOn, daysLeft });
            b.documentIds.push(d.id);
        }

        const trucks = await this.vehicles.find({ where: { kind: VehicleKind.TRUCK } });
        const ownerIds = [...new Set(trucks.map((t) => t.ownerId))];
        const settingsRows = ownerIds.length ? await this.settings.findBy({ ownerId: In(ownerIds) }) : [];
        const settingsByOwner = new Map(settingsRows.map((s) => [s.ownerId, s]));
        for (const t of trucks) {
            const s = settingsByOwner.get(t.ownerId) ?? DEFAULT_SETTINGS;
            const oil = oilStatus(t, s.oilAlertKm, today);
            if (!oil.configured || !shouldAlertOil(oil.level, t.lastOilAlertOn, today)) continue;
            const b = batch(t.ownerId);
            b.alerts.push({ kind: 'oil', plate: t.plate, kmLeft: oil.kmLeft, daysLeft: oil.daysLeft });
            b.vehicleIds.push(t.id);
        }

        let notified = 0;
        for (const [ownerId, b] of batches) {
            try {
                await this.deliver(ownerId, b, settingsByOwner.get(ownerId), today);
                notified++;
            } catch (error) {
                // One owner's failure (e.g. SMTP) must not block the others.
                this.logger.error(`Reminders for ${ownerId} failed: ${(error as Error).message}`);
            }
        }
        return notified;
    }

    private async deliver(ownerId: string, b: OwnerBatch, settings: FleetSettings | undefined, today: string) {
        for (const alert of b.alerts) {
            await this.notifications.create(ownerId, { message: alertLine(alert), type: notificationType(alert) });
        }

        const emailAlerts = settings ? settings.emailAlerts : (await this.settings.findOneBy({ ownerId }))?.emailAlerts ?? true;
        if (emailAlerts) {
            const user = await this.users.findOneBy({ id: ownerId });
            if (user?.email) {
                const { subject, text } = emailDigest(user.name, b.alerts, process.env.APP_URL ?? 'http://localhost:5173');
                await this.mailer.sendText(user.email, subject, text);
            }
        }

        // Mark as handled only after delivery, so a failed run retries tomorrow's cron.
        if (b.documentIds.length) await this.documents.update({ id: In(b.documentIds) }, { lastAlertedOn: today });
        if (b.vehicleIds.length) await this.vehicles.update({ id: In(b.vehicleIds) }, { lastOilAlertOn: today });
    }
}
