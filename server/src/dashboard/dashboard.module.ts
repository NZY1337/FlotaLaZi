import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { DocumentsModule } from '../documents/documents.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, Driver]), DocumentsModule, VehiclesModule, TransactionsModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
