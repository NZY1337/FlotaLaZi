import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './http-setup';
import * as dotenv from 'dotenv';

dotenv.config();


async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    configureApp(app);

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
