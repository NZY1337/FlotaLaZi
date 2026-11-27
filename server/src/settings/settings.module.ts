import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetSettings } from './entities/fleet-settings.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
    imports: [TypeOrmModule.forFeature([FleetSettings, Vehicle, Driver])],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule { }
