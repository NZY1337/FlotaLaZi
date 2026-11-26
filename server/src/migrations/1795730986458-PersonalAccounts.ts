import { MigrationInterface, QueryRunner } from "typeorm";

export class PersonalAccounts1795730986458 implements MigrationInterface {
    name = 'PersonalAccounts1795730986458'

    // fleet_settings.accountType (null = not chosen) and a CAR vehicle kind.
    // No new table, so no RLS change.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."fleet_settings_accounttype_enum" AS ENUM('FIRM', 'PERSONAL')`);
        await queryRunner.query(`ALTER TABLE "fleet_settings" ADD "accountType" "public"."fleet_settings_accounttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_509c3f1f5f91115305b9386d4a"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_kind_enum" RENAME TO "vehicles_kind_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_kind_enum" AS ENUM('TRUCK', 'TRAILER', 'CAR')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "kind" TYPE "public"."vehicles_kind_enum" USING "kind"::"text"::"public"."vehicles_kind_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_kind_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_509c3f1f5f91115305b9386d4a" ON "vehicles" ("ownerId", "kind") `);
    }

    // Reverting fails while any CAR vehicle exists: delete those first, on purpose.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_509c3f1f5f91115305b9386d4a"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_kind_enum_old" AS ENUM('TRUCK', 'TRAILER')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "kind" TYPE "public"."vehicles_kind_enum_old" USING "kind"::"text"::"public"."vehicles_kind_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_kind_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_kind_enum_old" RENAME TO "vehicles_kind_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_509c3f1f5f91115305b9386d4a" ON "vehicles" ("ownerId", "kind") `);
        await queryRunner.query(`ALTER TABLE "fleet_settings" DROP COLUMN "accountType"`);
        await queryRunner.query(`DROP TYPE "public"."fleet_settings_accounttype_enum"`);
    }

}
