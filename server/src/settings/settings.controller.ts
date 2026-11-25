import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('settings')
export class SettingsController {
    constructor(private readonly settings: SettingsService) { }

    @Get()
    get(@Req() req: AuthRequest) {
        return this.settings.get(req.user.id);
    }

    @Patch()
    update(@Req() req: AuthRequest, @Body() dto: UpdateSettingsDto) {
        return this.settings.update(req.user.id, dto);
    }
}
