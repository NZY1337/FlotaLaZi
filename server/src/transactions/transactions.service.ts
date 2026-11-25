import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateTransactionDto, TransactionQueryDto, UpdateTransactionDto } from './dto/transaction.dto';
import { SettingsService } from '../settings/settings.service';
import { decimalToMinor, toRonMinor } from '../fleet/money';
import { found } from '../fleet/owned';
import { summarize } from './summary';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction) private readonly repo: Repository<Transaction>,
        @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
        private readonly settings: SettingsService,
    ) { }

    private where(ownerId: string, q: TransactionQueryDto): FindOptionsWhere<Transaction> {
        if (q.from && q.to && q.from > q.to) throw new BadRequestException('from must not be after to');
        const where: FindOptionsWhere<Transaction> = { ownerId };
        if (q.from && q.to) where.date = Between(q.from, q.to);
        else if (q.from) where.date = MoreThanOrEqual(q.from);
        else if (q.to) where.date = LessThanOrEqual(q.to);
        if (q.vehicleId) where.vehicleId = q.vehicleId;
        if (q.type) where.type = q.type;
        return where;
    }

    list(ownerId: string, q: TransactionQueryDto) {
        return this.repo.find({ where: this.where(ownerId, q), order: { date: 'DESC', createdAt: 'DESC' } });
    }

    async summary(ownerId: string, q: TransactionQueryDto) {
        const rows = await this.repo.find({
            where: this.where(ownerId, { ...q, type: undefined }),
            select: ['type', 'date', 'amount', 'currency', 'amountRon', 'category', 'vehicleId'],
        });
        return summarize(rows);
    }

    private async assertVehicle(ownerId: string, vehicleId: string | null | undefined) {
        if (!vehicleId) return;
        found(await this.vehicles.findOneBy({ id: vehicleId, ownerId }), 'Vehicle');
    }

    async create(ownerId: string, dto: CreateTransactionDto) {
        await this.assertVehicle(ownerId, dto.vehicleId);
        const { eurRate } = await this.settings.get(ownerId);
        const amount = decimalToMinor(dto.amount);
        const row = this.repo.create({
            ownerId,
            type: dto.type,
            date: dto.date,
            amount,
            currency: dto.currency,
            eurRate,
            amountRon: toRonMinor(amount, dto.currency, eurRate),
            category: dto.category,
            vehicleId: dto.vehicleId ?? null,
            liters: dto.liters ?? null,
            notes: dto.notes ?? '',
        });
        return this.repo.save(row);
    }

    async update(ownerId: string, id: string, dto: UpdateTransactionDto) {
        const row = found(await this.repo.findOneBy({ id, ownerId }), 'Transaction');
        if (dto.vehicleId !== undefined) await this.assertVehicle(ownerId, dto.vehicleId);
        const { amount, ...rest } = dto;
        Object.assign(row, rest);
        if (amount !== undefined) row.amount = decimalToMinor(amount);
        // Keep the rate captured at creation; only the converted value follows edits.
        row.amountRon = toRonMinor(row.amount, row.currency, row.eurRate);
        return this.repo.save(row);
    }

    async remove(ownerId: string, id: string) {
        const row = found(await this.repo.findOneBy({ id, ownerId }), 'Transaction');
        await this.repo.remove(row);
    }
}
