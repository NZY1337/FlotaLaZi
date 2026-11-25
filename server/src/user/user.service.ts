import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../utils/constants';
import { NodemailerService } from '../../services/nodemailer/nodemailer.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(@InjectRepository(UserEntity) private repo: Repository<UserEntity>,
        private readonly nodemailer: NodemailerService
    ) { }

    // Runs on every authenticated request (UserSyncInterceptor), often several
    // in parallel on a first login. INSERT … ON CONFLICT DO NOTHING lets exactly
    // one of them see the row as new, so the welcome email goes out once.
    async upsertUser(user: CreateUserDto) {
        const values = { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
        const inserted = await this.repo.createQueryBuilder()
            .insert()
            .values(values)
            .orIgnore()
            .returning('id')
            .execute();
        const isNew = Array.isArray(inserted.raw) && inserted.raw.length > 0;

        if (!isNew) {
            await this.repo.update({ id: user.id }, { email: user.email, name: user.name, avatar: user.avatar });
            return;
        }

        this.logger.log(`New user created: ${user.email} (${user.id})`);
        // Never block the request on email: a slow or failing mail provider
        // must not delay the user's first page load.
        this.nodemailer.sendWelcomeEmail(user.email, user.name)
            .catch((error: Error) => this.logger.warn(`Welcome email to ${user.email} failed: ${error.message}`));
    }

    findById(id: string): Promise<UserEntity | null> {
        return this.repo.findOneBy({ id });
    }

    findAll(): Promise<UserEntity[]> {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }

    async updateRole(id: string, role: Role): Promise<UserEntity> {
        await this.repo.update({ id }, { role });
        return this.repo.findOneByOrFail({ id });
    }

    async deleteUser(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    async getStats(): Promise<{
        totalUsers: number;
        adminCount: number;
        userCount: number;
        newLast7Days: number;
        newLast30Days: number;
    }> {
        const now = new Date();
        const minus7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const minus30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [totalUsers, adminCount, newLast7Days, newLast30Days] = await Promise.all([
            this.repo.count(),
            this.repo.count({ where: { role: Role.ADMIN } }),
            this.repo.createQueryBuilder('u').where('u.createdAt >= :d', { d: minus7 }).getCount(),
            this.repo.createQueryBuilder('u').where('u.createdAt >= :d', { d: minus30 }).getCount(),
        ]);

        return { totalUsers, adminCount, userCount: totalUsers - adminCount, newLast7Days, newLast30Days };
    }
}