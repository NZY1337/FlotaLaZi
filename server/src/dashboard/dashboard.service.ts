import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentsService } from '../documents/documents.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { VehicleKind } from '../vehicles/entities/vehicle.entity';
import { monthRange, todayYmd } from '../fleet/dates';

const MAX_ALERTS = 8;
const RECENT_EXPENSES = 6;

// Read-only aggregation for the "Panou" screen. No logic of its own beyond
// picking and trimming what the other modules already compute.
@Injectable()
export class DashboardService {
    constructor(
        private readonly documents: DocumentsService,
        private readonly vehicles: VehiclesService,
        private readonly transactions: TransactionsService,
        @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
        @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    ) { }

    async get(ownerId: string) {
        const today = todayYmd();
        const month = monthRange(today);
        const [documents, vehicles, summary, recentExpenses, driverCount] = await Promise.all([
            this.documents.list(ownerId),
            this.vehicles.list(ownerId),
            this.transactions.summary(ownerId, month),
            this.txRepo.find({
                where: { ownerId, type: TransactionType.EXPENSE },
                relations: { vehicle: true },
                order: { date: 'DESC', createdAt: 'DESC' },
                take: RECENT_EXPENSES,
            }),
            this.drivers.countBy({ ownerId }),
        ]);

        const urgent = documents.filter((d) => d.level !== 'green');
        const trucks = vehicles.filter((v) => v.kind === VehicleKind.TRUCK);

        return {
            today,
            month: { ...month, totals: summary.totals },
            documentAlerts: urgent.slice(0, MAX_ALERTS),
            urgentDocumentCount: urgent.length,
            oil: trucks
                .filter((t) => t.oil?.configured)
                .map((t) => ({ vehicleId: t.id, plate: t.plate, km: t.km, ...t.oil! })),
            recentExpenses: recentExpenses.map(({ vehicle, ...t }) => ({ ...t, vehiclePlate: vehicle?.plate ?? null })),
            counts: {
                trucks: trucks.length,
                trailers: vehicles.length - trucks.length,
                drivers: driverCount,
            },
        };
    }
}
