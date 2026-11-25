import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionQueryDto, UpdateTransactionDto } from './dto/transaction.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactions: TransactionsService) { }

    @Get()
    list(@Req() req: AuthRequest, @Query() q: TransactionQueryDto) {
        return this.transactions.list(req.user.id, q);
    }

    @Get('summary')
    summary(@Req() req: AuthRequest, @Query() q: TransactionQueryDto) {
        return this.transactions.summary(req.user.id, q);
    }

    @Post()
    create(@Req() req: AuthRequest, @Body() dto: CreateTransactionDto) {
        return this.transactions.create(req.user.id, dto);
    }

    @Patch(':id')
    update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionDto) {
        return this.transactions.update(req.user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
        return this.transactions.remove(req.user.id, id);
    }
}
