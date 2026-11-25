import { Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { RemindersService } from './reminders.service';

@UseGuards(SupabaseAuthGuard)
@Controller('reminders')
export class RemindersController {
    constructor(private readonly reminders: RemindersService) { }

    // No body. Sends the caller (only) what currently needs attention; rate-limited per owner.
    @Post('test')
    @HttpCode(200)
    test(@Req() req: AuthRequest) {
        return this.reminders.sendTest(req.user.id);
    }
}
