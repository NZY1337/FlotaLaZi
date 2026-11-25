import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();


async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    // Legacy backups (POST /import/legacy) can exceed the 100kb default.
    app.useBodyParser('json', { limit: '5mb' });
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, }));

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
