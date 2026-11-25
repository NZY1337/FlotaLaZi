import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';

// Public catalog: inactive services are never exposed, neither in the list  nor
// by slug — an inactive slug is a 404, same as one that doesn't exist.
@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
    ) { }

    findAllActive() {
        return this.serviceRepository.find({
            where: { active: true },
            order: { createdAt: 'ASC' },
        });
    }

    async findActiveBySlug(slug: string) {
        const service = await this.serviceRepository.findOne({ where: { slug, active: true } });
        if (!service) throw new NotFoundException(`Service "${slug}" not found`);

        return service;
    }
}
