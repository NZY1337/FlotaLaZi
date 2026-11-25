import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CatalogService } from './catalog.service';
import { Service } from './entities/service.entity';

describe('CatalogService', () => {
    const find = jest.fn();
    const findOne = jest.fn();
    const catalogService = new CatalogService({ find, findOne } as unknown as Repository<Service>);

    beforeEach(() => jest.clearAllMocks());

    describe('findAllActive', () => {
        it('queries only active services, oldest first', async () => {
            const services = [{ slug: 'crm-sync' }, { slug: 'invoice-bot' }];
            find.mockResolvedValue(services);

            await expect(catalogService.findAllActive()).resolves.toBe(services);
            expect(find).toHaveBeenCalledWith({ where: { active: true }, order: { createdAt: 'ASC' } });
        });
    });

    describe('findActiveBySlug', () => {
        it('returns the service when an active one matches the slug', async () => {
            const service = { slug: 'crm-sync' };
            findOne.mockResolvedValue(service);

            await expect(catalogService.findActiveBySlug('crm-sync')).resolves.toBe(service);
            expect(findOne).toHaveBeenCalledWith({ where: { slug: 'crm-sync', active: true } });
        });

        // The query filters on active: true, so an inactive service comes back
        // as null here too — it must be indistinguishable from a missing one.
        it('throws NotFoundException when nothing active matches the slug', async () => {
            findOne.mockResolvedValue(null);

            await expect(catalogService.findActiveBySlug('nope')).rejects.toThrow(NotFoundException);
        });
    });
});
