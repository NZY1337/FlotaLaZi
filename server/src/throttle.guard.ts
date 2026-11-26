import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Rate limits run before authentication, so the user id is not known yet.
// Count per session token when there is one (one owner on a busy office NAT
// does not use up another's allowance), else per client IP.
@Injectable()
export class FleetThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> { // eslint-disable-line @typescript-eslint/no-explicit-any -- express request, as ThrottlerGuard types it
        const auth: unknown = req.headers?.authorization;
        if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
            return 'token:' + createHash('sha256').update(auth.slice(7)).digest('hex');
        }
        return 'ip:' + (req.ip ?? 'unknown');
    }
}
