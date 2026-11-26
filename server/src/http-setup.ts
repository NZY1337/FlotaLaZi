import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

// Everything about how the HTTP layer is configured, shared by main.ts and the
// API tests so the tests exercise the same CORS, headers and limits.

const DEFAULT_ORIGINS = [
    'https://www.flotalazi.ro',
    'https://flotalazi.ro',
    'https://flota-mea.vercel.app',
    'http://localhost:5173',
];

/** Browser origins allowed to call the API: ALLOWED_ORIGINS (comma-separated) or the defaults. */
export function allowedOrigins(env: string | undefined = process.env.ALLOWED_ORIGINS): string[] {
    const list = env?.split(',').map((o) => o.trim()).filter(Boolean);
    return list?.length ? list : DEFAULT_ORIGINS;
}

export function configureApp(app: NestExpressApplication) {
    // Railway puts one proxy in front of the app: trust it, so the rate limiter
    // sees the client's IP and not the proxy's.
    app.set('trust proxy', 1);
    app.use(helmet());
    // Legacy backups (POST /import/legacy) can exceed the 100kb default.
    app.useBodyParser('json', { limit: '5mb' });
    app.setGlobalPrefix('api');
    const origins = allowedOrigins();
    app.enableCors({
        // No Origin header = not a browser (curl, the server itself): CORS does not apply.
        origin: (origin, done) => done(null, !origin || origins.includes(origin)),
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}
