import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { DashboardService } from './dashboard.service';

@UseGuards(SupabaseAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboard: DashboardService) { }

    @Get()
    get(@Req() req: AuthRequest) {
        return this.dashboard.get(req.user.id);
    }
}
