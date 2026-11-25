import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { found } from '../fleet/owned';

@Injectable()
export class DriversService {
    constructor(@InjectRepository(Driver) private readonly repo: Repository<Driver>) { }

    list(ownerId: string) {
        return this.repo.find({ where: { ownerId }, order: { name: 'ASC' } });
    }

    create(ownerId: string, dto: CreateDriverDto) {
        return this.repo.save(this.repo.create({ ...dto, ownerId }));
    }

    async update(ownerId: string, id: string, dto: UpdateDriverDto) {
        const driver = found(await this.repo.findOneBy({ id, ownerId }), 'Driver');
        Object.assign(driver, dto);
        return this.repo.save(driver);
    }

    async remove(ownerId: string, id: string) {
        const driver = found(await this.repo.findOneBy({ id, ownerId }), 'Driver');
        await this.repo.remove(driver);
    }
}
