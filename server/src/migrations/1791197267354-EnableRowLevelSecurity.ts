import { MigrationInterface, QueryRunner } from "typeorm";

// Supabase exposes every table in the `public` schema through its Data API
// (PostgREST), and the publishable key is shipped in the client bundle. A
// table created by SQL/TypeORM has RLS *off*, so anyone with that key could
// read or write it directly, bypassing this backend entirely.
//
// Enabling RLS with NO policies makes the default "deny" for the anon and
// authenticated roles. The NestJS backend connects as the table owner / the
// `postgres` role, which bypasses RLS, so it is unaffected. Don't add
// policies unless the frontend should ever query these tables directly —
// by design it only talks to the backend (CLAUDE.md §3).
//
// REMINDER: every new table needs this too (orders, payments, ...). Put the
// ENABLE ROW LEVEL SECURITY in the migration that creates it.
//
// `migrations` is TypeORM's own bookkeeping table; it lives in `public` too.
const TABLES = ["users", "notifications", "services", "migrations"];

export class EnableRowLevelSecurity1791197267354 implements MigrationInterface {
    name = 'EnableRowLevelSecurity1791197267354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of TABLES) {
            await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of [...TABLES].reverse()) {
            await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
        }
    }

}
