import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetDocument } from '../documents/entities/document.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { FleetSettings } from '../settings/entities/fleet-settings.entity';
import { UserEntity } from '../user/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RemindersService } from './reminders.service';

@Module({
    imports: [TypeOrmModule.forFeature([FleetDocument, Vehicle, FleetSettings, UserEntity]), NotificationsModule],
    providers: [RemindersService],
})
export class RemindersModule { }
