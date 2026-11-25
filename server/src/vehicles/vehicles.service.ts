import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Vehicle, VehicleKind } from './entities/vehicle.entity';
import { CreateVehicleDto, OilChangeDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { SettingsService } from '../settings/settings.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { oilStatus } from '../fleet/status';
import { todayYmd } from '../fleet/dates';
import { found } from '../fleet/owned';

const TRUCK_ONLY = ['attachedTrailerId', 'km', 'lastOilKm', 'oilIntervalKm', 'lastOilDate', 'oilIntervalMonths'] as const;

export const OIL_CHANGE_CATEGORY = 'Schimb ulei';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>,
        private readonly settings: SettingsService,
        private readonly transactions: TransactionsService,
    ) { }

    /** Vehicles with their computed oil status (trucks) and coupling info. */
    async list(ownerId: string) {
        const [vehicles, settings] = await Promise.all([
            // Postgres sorts enums by declaration order: trucks first.
            this.repo.find({ where: { ownerId }, order: { kind: 'ASC', plate: 'ASC' } }),
            this.settings.get(ownerId),
        ]);
        const today = todayYmd();
        const byId = new Map(vehicles.map((v) => [v.id, v]));
        return vehicles.map((v) => {
            if (v.kind === VehicleKind.TRUCK) {
                return { ...v, oil: oilStatus(v, settings.oilAlertKm, today), attachedTrailer: this.ref(v.attachedTrailerId ? byId.get(v.attachedTrailerId) : undefined) };
            }
            const truck = vehicles.find((t) => t.attachedTrailerId === v.id) ?? null;
            return { ...v, oil: null, coupledTruck: this.ref(truck) };
        });
    }

    private ref(v: Vehicle | null | undefined) {
        return v ? { id: v.id, plate: v.plate } : null;
    }

    private async ensureTrailer(manager: EntityManager, ownerId: string, trailerId: string) {
        const trailer = found(await manager.findOneBy(Vehicle, { id: trailerId, ownerId }), 'Trailer');
        if (trailer.kind !== VehicleKind.TRAILER) throw new BadRequestException('attachedTrailerId must point to a trailer');
    }

    /** Applies kind rules: trailers never carry truck fields and vice versa. */
    private clean(kind: VehicleKind, dto: UpdateVehicleDto): UpdateVehicleDto {
        const data: UpdateVehicleDto = { ...dto };
        if (kind === VehicleKind.TRAILER) {
            for (const key of TRUCK_ONLY) delete data[key];
        } else {
            delete data.trailerType;
        }
        return data;
    }

    async create(ownerId: string, dto: CreateVehicleDto) {
        const { kind, ...rest } = dto;
        const data = this.clean(kind, rest);
        return this.repo.manager.transaction(async (manager) => {
            if (data.attachedTrailerId) {
                await this.ensureTrailer(manager, ownerId, data.attachedTrailerId);
                await manager.update(Vehicle, { ownerId, attachedTrailerId: data.attachedTrailerId }, { attachedTrailerId: null });
            }
            const vehicle = manager.create(Vehicle, { ...data, kind, ownerId, trailerType: kind === VehicleKind.TRAILER ? data.trailerType ?? null : null });
            return manager.save(vehicle);
        });
    }

    async update(ownerId: string, id: string, dto: UpdateVehicleDto) {
        return this.repo.manager.transaction(async (manager) => {
            const vehicle = found(await manager.findOneBy(Vehicle, { id, ownerId }), 'Vehicle');
            const data = this.clean(vehicle.kind, dto);
            if (data.attachedTrailerId) {
                await this.ensureTrailer(manager, ownerId, data.attachedTrailerId);
                // Coupling to this truck uncouples it from any other one.
                await manager.update(Vehicle, { ownerId, attachedTrailerId: data.attachedTrailerId }, { attachedTrailerId: null });
            }
            // Oil data changed by hand → restart reminder bookkeeping.
            if (data.lastOilKm !== undefined || data.lastOilDate !== undefined) vehicle.lastOilAlertOn = null;
            Object.assign(vehicle, data);
            return manager.save(vehicle);
        });
    }

    async remove(ownerId: string, id: string) {
        const vehicle = found(await this.repo.findOneBy({ id, ownerId }), 'Vehicle');
        await this.repo.remove(vehicle);
    }

    /** Records an oil change: resets the counters and optionally logs the cost. */
    async oilChange(ownerId: string, id: string, dto: OilChangeDto) {
        const vehicle = found(await this.repo.findOneBy({ id, ownerId }), 'Vehicle');
        if (vehicle.kind !== VehicleKind.TRUCK) throw new BadRequestException('Only trucks have oil changes');
        vehicle.km = Math.max(vehicle.km ?? 0, dto.km);
        vehicle.lastOilKm = dto.km;
        vehicle.lastOilDate = dto.date;
        vehicle.lastOilAlertOn = null;
        const saved = await this.repo.save(vehicle);
        if (dto.cost) {
            await this.transactions.create(ownerId, {
                type: TransactionType.EXPENSE,
                date: dto.date,
                amount: dto.cost,
                currency: dto.currency ?? 'RON',
                category: OIL_CHANGE_CATEGORY,
                vehicleId: id,
                notes: `Schimb ulei la ${dto.km} km`,
            });
        }
        return saved;
    }
}
