import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('me')
    @UseGuards(SupabaseAuthGuard)
    getMe(@Req() req: AuthReq) {
        return this.userService.findById(req.user.id);
    }
}
