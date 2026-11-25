import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, OilChangeDto, UpdateVehicleDto } from './dto/vehicle.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehicles: VehiclesService) { }

    @Get()
    list(@Req() req: AuthRequest) {
        return this.vehicles.list(req.user.id);
    }

    @Post()
    create(@Req() req: AuthRequest, @Body() dto: CreateVehicleDto) {
        return this.vehicles.create(req.user.id, dto);
    }

    @Patch(':id')
    update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
        return this.vehicles.update(req.user.id, id, dto);
    }

    @Post(':id/oil-change')
    oilChange(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OilChangeDto) {
        return this.vehicles.oilChange(req.user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
        return this.vehicles.remove(req.user.id, id);
    }
}
