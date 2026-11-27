import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Vehicle, VehicleKind, hasEngine } from './entities/vehicle.entity';
import { CreateVehicleDto, OilChangeDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { SettingsService } from '../settings/settings.service';
import { vehicleKindsFor } from '../settings/entities/fleet-settings.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { odometerProblem, oilStatus } from '../fleet/status';
import { todayYmd } from '../fleet/dates';
import { found } from '../fleet/owned';

const ENGINE_ONLY = ['attachedTrailerId', 'km', 'lastOilKm', 'oilIntervalKm', 'lastOilDate', 'oilIntervalMonths'] as const;

export const OIL_CHANGE_CATEGORY = 'Schimb ulei';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>,
        private readonly settings: SettingsService,
        private readonly transactions: TransactionsService,
    ) { }

    /** Vehicles with their computed oil status (trucks, cars) and coupling info. */
    async list(ownerId: string) {
        const [vehicles, settings] = await Promise.all([
            // Postgres sorts enums by declaration order: trucks first.
            this.repo.find({ where: { ownerId }, order: { kind: 'ASC', plate: 'ASC' } }),
            this.settings.get(ownerId),
        ]);
        const today = todayYmd();
        const byId = new Map(vehicles.map((v) => [v.id, v]));
        return vehicles.map((v) => {
            if (hasEngine(v.kind)) {
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

    /** Applies kind rules: trailers carry no engine fields, only trucks pull a trailer. */
    private clean(kind: VehicleKind, dto: UpdateVehicleDto): UpdateVehicleDto {
        const data: UpdateVehicleDto = { ...dto };
        if (kind === VehicleKind.TRAILER) {
            for (const key of ENGINE_ONLY) delete data[key];
        } else {
            delete data.trailerType;
        }
        if (kind === VehicleKind.CAR) delete data.attachedTrailerId;
        return data;
    }

    async create(ownerId: string, dto: CreateVehicleDto) {
        const { kind, ...rest } = dto;
        const { accountType } = await this.settings.get(ownerId);
        if (!vehicleKindsFor(accountType).includes(kind)) {
            throw new BadRequestException(kind === VehicleKind.CAR
                ? 'Mașinile se adaugă doar într-un cont personal. Un cont de firmă are camioane și remorci.'
                : 'Un cont personal are doar mașini. Pentru camioane și remorci, alege „Firmă de transport” în Setări.');
        }
        const data = this.clean(kind, rest);
        const odometer = odometerProblem(data.km, data.lastOilKm);
        if (odometer) throw new BadRequestException(odometer);
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
            // Checked on the merged values: the km modal sends km alone.
            const odometer = odometerProblem(data.km !== undefined ? data.km : vehicle.km, data.lastOilKm !== undefined ? data.lastOilKm : vehicle.lastOilKm);
            if (odometer) throw new BadRequestException(odometer);
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
        if (!hasEngine(vehicle.kind)) throw new BadRequestException('Trailers have no oil changes');
        if (vehicle.lastOilKm != null && dto.km < vehicle.lastOilKm) {
            throw new BadRequestException(`Schimbul de ulei nu poate fi la mai puțini km decât cel anterior (${vehicle.lastOilKm} km). Dacă cel vechi e greșit, corectează-l din „Editează”.`);
        }
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
