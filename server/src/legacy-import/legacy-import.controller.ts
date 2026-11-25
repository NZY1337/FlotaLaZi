import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { LegacyImportService } from './legacy-import.service';

@UseGuards(SupabaseAuthGuard)
@Controller('import')
export class LegacyImportController {
    constructor(private readonly importer: LegacyImportService) { }

    // The body is the old app's free-form backup; legacy-mapper validates every
    // field itself, so there's deliberately no DTO class here.
    @Post('legacy')
    importLegacy(@Req() req: AuthRequest, @Body() backup: unknown) {
        return this.importer.import(req.user.id, backup);
    }
}
