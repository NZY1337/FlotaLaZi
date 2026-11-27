import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { FleetDocument } from '../documents/entities/document.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { AccountType, FleetSettings } from '../settings/entities/fleet-settings.entity';
import { SettingsService } from '../settings/settings.service';
import { mapLegacyBackup } from './legacy-mapper';

@Injectable()
export class LegacyImportService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly settings: SettingsService,
    ) { }

    /** Imports a legacy backup into an empty account, all-or-nothing. */
    async import(ownerId: string, backup: unknown) {
        const plan = mapLegacyBackup(backup);
        const { accountType } = await this.settings.get(ownerId);
        if (accountType === AccountType.PERSONAL) {
            // The old app's backup is trucks and trailers: a firm's data.
            throw new BadRequestException('Importul din aplicația veche e pentru conturile de firmă.');
        }

        return this.dataSource.transaction(async (m) => {
            const existing = (await m.countBy(Vehicle, { ownerId })) + (await m.countBy(Transaction, { ownerId }));
            if (existing > 0) {
                // Importing twice would duplicate everything; the old app has no stable ids to merge on.
                throw new ConflictException('Importul se poate face doar într-un cont gol (fără vehicule sau tranzacții).');
            }

            if (Object.keys(plan.settings).length) await m.update(FleetSettings, { ownerId }, plan.settings);

            // Trailers first so trucks can reference them.
            const ordered = [...plan.vehicles].sort((a, b) => (a.attachedTrailerId ? 1 : 0) - (b.attachedTrailerId ? 1 : 0));
            for (const v of ordered) await m.insert(Vehicle, { ...v, ownerId });
            if (plan.documents.length) await m.insert(FleetDocument, plan.documents.map((d) => ({ ...d, ownerId })));
            for (let i = 0; i < plan.transactions.length; i += 500) {
                await m.insert(Transaction, plan.transactions.slice(i, i + 500).map((t) => ({ ...t, ownerId })));
            }

            return {
                vehicles: plan.vehicles.length,
                documents: plan.documents.length,
                transactions: plan.transactions.length,
                skipped: plan.skipped,
            };
        });
    }
}
