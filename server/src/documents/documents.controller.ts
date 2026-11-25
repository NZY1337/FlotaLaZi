import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthRequest } from '../fleet/owned';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documents: DocumentsService) { }

    @Get()
    list(@Req() req: AuthRequest) {
        return this.documents.list(req.user.id);
    }

    @Post()
    create(@Req() req: AuthRequest, @Body() dto: CreateDocumentDto) {
        return this.documents.create(req.user.id, dto);
    }

    @Patch(':id')
    update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentDto) {
        return this.documents.update(req.user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
        return this.documents.remove(req.user.id, id);
    }
}
