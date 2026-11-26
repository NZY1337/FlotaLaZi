import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FleetDocument } from './entities/document.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { SettingsService } from '../settings/settings.service';
import { ownDocumentsLabel } from '../settings/entities/fleet-settings.entity';
import { expiryStatus } from '../fleet/status';
import { todayYmd } from '../fleet/dates';
import { found } from '../fleet/owned';

export type DocumentWithStatus = FleetDocument & {
    daysLeft: number;
    level: 'red' | 'yellow' | 'green';
    /** Plate or driver name; "Firmă" (or "Personal") for the account's own documents. */
    subject: string;
};

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(FleetDocument) private readonly repo: Repository<FleetDocument>,
        @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
        @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
        private readonly settings: SettingsService,
    ) { }

    static withStatus(doc: FleetDocument, today: string, ownLabel = 'Firmă'): DocumentWithStatus {
        const { vehicle, driver, ...rest } = doc;
        const subject = vehicle?.plate ?? driver?.name ?? ownLabel;
        return { ...rest, ...expiryStatus(doc.expiresOn, doc.alertDays, today), subject } as DocumentWithStatus;
    }

    /** All documents, most urgent first. */
    async list(ownerId: string): Promise<DocumentWithStatus[]> {
        const [docs, settings] = await Promise.all([
            this.repo.find({
                where: { ownerId },
                relations: { vehicle: true, driver: true },
                order: { expiresOn: 'ASC' },
            }),
            this.settings.get(ownerId),
        ]);
        const today = todayYmd();
        const ownLabel = ownDocumentsLabel(settings.accountType);
        return docs.map((d) => DocumentsService.withStatus(d, today, ownLabel));
    }

    private async assertSubject(ownerId: string, vehicleId: string | null | undefined, driverId: string | null | undefined) {
        if (vehicleId && driverId) throw new BadRequestException('A document belongs to a vehicle or a driver, not both');
        if (vehicleId) found(await this.vehicles.findOneBy({ id: vehicleId, ownerId }), 'Vehicle');
        if (driverId) found(await this.drivers.findOneBy({ id: driverId, ownerId }), 'Driver');
    }

    async create(ownerId: string, dto: CreateDocumentDto) {
        await this.assertSubject(ownerId, dto.vehicleId, dto.driverId);
        const alertDays = dto.alertDays ?? (await this.settings.get(ownerId)).docAlertDays;
        return this.repo.save(this.repo.create({
            ...dto,
            vehicleId: dto.vehicleId ?? null,
            driverId: dto.driverId ?? null,
            alertDays,
            ownerId,
        }));
    }

    async update(ownerId: string, id: string, dto: UpdateDocumentDto) {
        const doc = found(await this.repo.findOneBy({ id, ownerId }), 'Document');
        const vehicleId = dto.vehicleId !== undefined ? dto.vehicleId : doc.vehicleId;
        const driverId = dto.driverId !== undefined ? dto.driverId : doc.driverId;
        await this.assertSubject(ownerId, vehicleId, driverId);
        // A renewed document (new expiry) starts its reminders over.
        if (dto.expiresOn && dto.expiresOn !== doc.expiresOn) doc.lastAlertedOn = null;
        Object.assign(doc, dto);
        return this.repo.save(doc);
    }

    async remove(ownerId: string, id: string) {
        const doc = found(await this.repo.findOneBy({ id, ownerId }), 'Document');
        await this.repo.remove(doc);
    }
}
