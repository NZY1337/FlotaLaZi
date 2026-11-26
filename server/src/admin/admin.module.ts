import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RolesGuard } from '../auth/roles.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
    imports: [UserModule],
    controllers: [AdminController],
    providers: [AdminService, RolesGuard],
})
export class AdminModule { }
