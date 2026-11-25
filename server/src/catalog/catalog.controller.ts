import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

// Public routes (CLAUDE.md §14) — deliberately no SupabaseAuthGuard.
@Controller('services')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Get()
    findAll() {
        return this.catalogService.findAllActive();
    }

    @Get(':slug')
    findOne(@Param('slug') slug: string) {
        return this.catalogService.findActiveBySlug(slug);
    }
}
