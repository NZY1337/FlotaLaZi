import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { Notification } from './notifications/entities/notification.entity';
import { Service } from './catalog/entities/service.entity';
import { CatalogModule } from './catalog/catalog.module';

// interceptors
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserSyncInterceptor } from './interceptors/user-sync.interceptor';

// entities
import { UserEntity } from './user/entities/user.entity';

// services
import { SupabaseModule } from '../services/supabase/supabase.module';
import { NodemailerModule } from '../services/nodemailer/nodemailer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskServiceModule } from '../services/taskservice/taskservice.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';


@Module({
    imports: [
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [UserEntity, Notification, Service],
            // Schema changes go through migrations only (npm run migration:run).
            synchronize: false,
        }),
        SupabaseModule,
        NodemailerModule,
        TaskServiceModule,
        UserModule,
        NotificationsModule,
        CatalogModule,
    ],
    providers: [{
        provide: APP_INTERCEPTOR,
        useClass: UserSyncInterceptor,
    }],
})

export class AppModule { }
