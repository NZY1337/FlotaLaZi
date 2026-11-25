import { MigrationInterface, QueryRunner } from "typeorm";

// EuroTrack fleet schema. Replaces Streamloop's `services` catalog table
// (CLAUDE.md history note) and creates the fleet tables with RLS enabled.
const NEW_TABLES = ["vehicles", "transactions", "fleet_settings", "drivers", "documents"];

export class EuroTrackFleet1795575793255 implements MigrationInterface {
    name = 'EuroTrackFleet1795575793255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Added by hand: the Streamloop catalog is not part of EuroTrack.
        await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."services_billingtype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_kind_enum" AS ENUM('TRUCK', 'TRAILER')`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_trailertype_enum" AS ENUM('SEMIREMORCA', 'REMORCA')`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "kind" "public"."vehicles_kind_enum" NOT NULL, "plate" character varying(20) NOT NULL, "name" character varying(100) NOT NULL DEFAULT '', "vin" character varying(17) NOT NULL DEFAULT '', "notes" text NOT NULL DEFAULT '', "trailerType" "public"."vehicles_trailertype_enum", "attachedTrailerId" uuid, "km" integer, "lastOilKm" integer, "oilIntervalKm" integer, "lastOilDate" date, "oilIntervalMonths" integer, "lastOilAlertOn" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_030a77fc42f85e2e660a7fbd5e" ON "vehicles" ("attachedTrailerId") WHERE "attachedTrailerId" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_509c3f1f5f91115305b9386d4a" ON "vehicles" ("ownerId", "kind") `);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('INCOME', 'EXPENSE')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "date" date NOT NULL, "amount" integer NOT NULL, "currency" character varying(3) NOT NULL, "eurRate" numeric(10,4) NOT NULL, "amountRon" integer NOT NULL, "category" character varying(60) NOT NULL, "vehicleId" uuid, "liters" numeric(10,2), "notes" text NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2f00239e2bdaa25d2bac64f374" ON "transactions" ("ownerId", "date") `);
        await queryRunner.query(`CREATE TABLE "fleet_settings" ("ownerId" uuid NOT NULL, "eurRate" numeric(10,4) NOT NULL, "oilAlertKm" integer NOT NULL DEFAULT '5000', "docAlertDays" integer NOT NULL DEFAULT '30', "emailAlerts" boolean NOT NULL DEFAULT true, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6eebb4827f93586ef7028f133ce" PRIMARY KEY ("ownerId"))`);
        await queryRunner.query(`CREATE TABLE "drivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "name" character varying(100) NOT NULL, "phone" character varying(30) NOT NULL DEFAULT '', "email" character varying(200) NOT NULL DEFAULT '', "notes" text NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_02d15527d1d89ac536a546c276" ON "drivers" ("ownerId") `);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "vehicleId" uuid, "driverId" uuid, "type" character varying(100) NOT NULL, "expiresOn" date NOT NULL, "alertDays" integer NOT NULL DEFAULT '30', "notes" text NOT NULL DEFAULT '', "lastAlertedOn" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_2167390e4b1b4ea29db2d7f58c" CHECK (NOT ("vehicleId" IS NOT NULL AND "driverId" IS NOT NULL)), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fe0661a7c24a5c1760a2432305" ON "documents" ("ownerId", "expiresOn") `);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_e89fc421e44dac4a4b0a126cbf8" FOREIGN KEY ("attachedTrailerId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_bbd16759038eb5a618fb829b0e5" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_7530142836b25b512fe66f830f8" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_42c2883cc4f370d5699bf805cb9" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // Added by hand (CLAUDE.md §11): Supabase's Data API must not expose these tables.
        for (const table of NEW_TABLES) {
            await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_42c2883cc4f370d5699bf805cb9"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_7530142836b25b512fe66f830f8"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_bbd16759038eb5a618fb829b0e5"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_e89fc421e44dac4a4b0a126cbf8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0661a7c24a5c1760a2432305"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02d15527d1d89ac536a546c276"`);
        await queryRunner.query(`DROP TABLE "drivers"`);
        await queryRunner.query(`DROP TABLE "fleet_settings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f00239e2bdaa25d2bac64f374"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_509c3f1f5f91115305b9386d4a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_030a77fc42f85e2e660a7fbd5e"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_trailertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_kind_enum"`);
        // Restores the empty Streamloop catalog table (same definition as Baseline).
        await queryRunner.query(`CREATE TYPE "public"."services_billingtype_enum" AS ENUM('ONE_TIME', 'SUBSCRIPTION')`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text NOT NULL, "shortDescription" character varying NOT NULL, "price" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'EUR', "billingType" "public"."services_billingtype_enum" NOT NULL DEFAULT 'ONE_TIME', "recurringPrice" integer, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_02cf0d0f46e11d22d952f623670" UNIQUE ("slug"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "services" ENABLE ROW LEVEL SECURITY`);
    }

}
