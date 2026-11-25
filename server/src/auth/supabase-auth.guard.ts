import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';

// services
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private readonly logger = new Logger(SupabaseAuthGuard.name);

    constructor(
        private readonly supabase: SupabaseService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader: string | undefined = request.headers['authorization'];

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.slice(7);
        const { data: { user }, error } = await this.supabase.getUser(token);

        if (error || !user) {
            // Log Supabase's reason (never the token): a wrong SUPABASE_SERVICE_ROLE_KEY
            // and an expired session both end up as the same 401 for the client.
            this.logger.warn(`Token rejected by Supabase: ${error?.status ?? ''} ${error?.message ?? 'no user'}`);
            throw new UnauthorizedException('Invalid or expired token');
        }

        request.user = {
            id: user.id,
            email: user.email,
            avatar: user.user_metadata.avatar_url ?? null,
            name: user.user_metadata.full_name,
        };

        return true;
    }
}
