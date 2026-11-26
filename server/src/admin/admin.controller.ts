import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../utils/constants';
import { AdminService } from './admin.service';

// Platform owner only. Anyone else gets a 404 (RolesGuard), so the route's
// existence is not revealed.
@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(private readonly admin: AdminService) { }

    @Get('overview')
    overview() {
        return this.admin.overview();
    }
}
