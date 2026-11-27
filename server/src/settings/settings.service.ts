import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository } from 'typeorm';
import { AccountType, DEFAULT_EUR_RATE, FleetSettings, vehicleKindsFor } from './entities/fleet-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Driver } from '../drivers/entities/driver.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(FleetSettings) private readonly repo: Repository<FleetSettings>,
        @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
        @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    ) { }

    /** Returns the owner's settings, creating the default row on first use. */
    async get(ownerId: string): Promise<FleetSettings> {
        const existing = await this.repo.findOneBy({ ownerId });
        if (existing) return existing;
        // Two first requests can race here (e.g. /vehicles and /settings together): ignore the duplicate.
        await this.repo.createQueryBuilder().insert().values({ ownerId, eurRate: DEFAULT_EUR_RATE }).orIgnore().execute();
        return this.repo.findOneByOrFail({ ownerId });
    }

    async update(ownerId: string, dto: UpdateSettingsDto): Promise<FleetSettings> {
        await this.get(ownerId);
        if (dto.accountType) await this.ensureFits(ownerId, dto.accountType);
        await this.repo.update({ ownerId }, dto);
        return this.repo.findOneByOrFail({ ownerId });
    }

    /**
     * An account switches type only when nothing it holds would be hidden by
     * the switch: hidden vehicles and drivers would still send alerts.
     */
    private async ensureFits(ownerId: string, accountType: AccountType) {
        const others = await this.vehicles.countBy({ ownerId, kind: Not(In(vehicleKindsFor(accountType))) });
        if (others > 0) {
            throw new BadRequestException(accountType === AccountType.PERSONAL
                ? 'Ai camioane sau remorci în cont. Șterge-le din Flotă, apoi schimbă tipul contului.'
                : 'Ai mașini în cont. Șterge-le din „Mașinile mele”, apoi schimbă tipul contului.');
        }
        if (accountType === AccountType.PERSONAL && await this.drivers.countBy({ ownerId }) > 0) {
            throw new BadRequestException('Ai șoferi în cont. Șterge-i din Șoferi, apoi schimbă tipul contului.');
        }
    }
}
