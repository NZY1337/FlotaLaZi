import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('drivers')
export class DriversController {
    constructor(private readonly drivers: DriversService) { }

    @Get()
    list(@Req() req: AuthRequest) {
        return this.drivers.list(req.user.id);
    }

    @Post()
    create(@Req() req: AuthRequest, @Body() dto: CreateDriverDto) {
        return this.drivers.create(req.user.id, dto);
    }

    @Patch(':id')
    update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDriverDto) {
        return this.drivers.update(req.user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
        return this.drivers.remove(req.user.id, id);
    }
}
