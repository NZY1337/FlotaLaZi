import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { LegacyImportController } from './legacy-import.controller';
import { LegacyImportService } from './legacy-import.service';

@Module({
    imports: [SettingsModule],
    controllers: [LegacyImportController],
    providers: [LegacyImportService],
})
export class LegacyImportModule { }
