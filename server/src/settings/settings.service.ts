import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_EUR_RATE, FleetSettings } from './entities/fleet-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
    constructor(@InjectRepository(FleetSettings) private readonly repo: Repository<FleetSettings>) { }

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
        await this.repo.update({ ownerId }, dto);
        return this.repo.findOneByOrFail({ ownerId });
    }
}
