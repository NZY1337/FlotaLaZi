import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';

// interceptors
import { UserSyncInterceptor } from './interceptors/user-sync.interceptor';

// entities
import { UserEntity } from './user/entities/user.entity';
import { Notification } from './notifications/entities/notification.entity';
import { FleetSettings } from './settings/entities/fleet-settings.entity';
import { Vehicle } from './vehicles/entities/vehicle.entity';
import { Driver } from './drivers/entities/driver.entity';
import { FleetDocument } from './documents/entities/document.entity';
import { Transaction } from './transactions/entities/transaction.entity';

// infrastructure
import { SupabaseModule } from '../services/supabase/supabase.module';
import { NodemailerModule } from '../services/nodemailer/nodemailer.module';

// modules
import { UserModule } from './user/user.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { DocumentsModule } from './documents/documents.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RemindersModule } from './reminders/reminders.module';
import { LegacyImportModule } from './legacy-import/legacy-import.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [UserEntity, Notification, FleetSettings, Vehicle, Driver, FleetDocument, Transaction],
            // Schema changes go through migrations only (npm run migration:run).
            synchronize: false,
            // Supabase's session pooler allows 15 clients per project, shared by
            // every server pointed at it (Railway + a dev laptop). pg's default
            // pool of 10 each overflows it; 5 is plenty for this app's load.
            extra: { max: Number(process.env.DB_POOL_MAX) || 5 },
        }),
        SupabaseModule,
        NodemailerModule,
        UserModule,
        NotificationsModule,
        SettingsModule,
        VehiclesModule,
        DriversModule,
        DocumentsModule,
        TransactionsModule,
        DashboardModule,
        RemindersModule,
        LegacyImportModule,
        AdminModule,
    ],
    providers: [{
        provide: APP_INTERCEPTOR,
        useClass: UserSyncInterceptor,
    }],
})

export class AppModule { }
