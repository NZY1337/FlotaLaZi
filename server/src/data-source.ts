import 'dotenv/config';
import { DataSource } from 'typeorm';

// Used ONLY by the TypeORM CLI (npm run migration:*). The running app builds
// its own connection in app.module.ts. Both read DATABASE_URL, so whichever
// database that points at is the one a migration will change.
//
// Entities are matched by glob so a new module's entity is picked up without
// editing this file (CLAUDE.md §16: entities live in <module>/entities/).
export default new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['src/**/entities/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
});
