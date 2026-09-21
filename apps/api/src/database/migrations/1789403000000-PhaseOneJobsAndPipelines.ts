import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhaseOneJobsAndPipelines1789403000000 implements MigrationInterface {
  name = 'PhaseOneJobsAndPipelines1789403000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_employmenttype_enum" AS ENUM('full_time','part_time','contract','temporary','internship','other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "employmentTypeV2" "public"."jobs_employmenttype_enum"`,
    );
    await queryRunner.query(
      `UPDATE "jobs" SET "employmentTypeV2" = CASE lower(replace(coalesce("employmentType", ''), ' ', '_')) WHEN 'full_time' THEN 'full_time'::"public"."jobs_employmenttype_enum" WHEN 'part_time' THEN 'part_time'::"public"."jobs_employmenttype_enum" WHEN 'contract' THEN 'contract'::"public"."jobs_employmenttype_enum" WHEN 'temporary' THEN 'temporary'::"public"."jobs_employmenttype_enum" WHEN 'internship' THEN 'internship'::"public"."jobs_employmenttype_enum" WHEN '' THEN NULL ELSE 'other'::"public"."jobs_employmenttype_enum" END`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "employmentType"`);
    await queryRunner.query(
      `ALTER TABLE "jobs" RENAME COLUMN "employmentTypeV2" TO "employmentType"`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" ADD "reopenedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "pipelines" ADD "version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "pipeline_stages" ADD "version" integer NOT NULL DEFAULT 1`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pipeline_stages" DROP COLUMN "version"`,
    );
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "reopenedAt"`);
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "employmentTypeLegacy" character varying`,
    );
    await queryRunner.query(
      `UPDATE "jobs" SET "employmentTypeLegacy" = "employmentType"::text`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "employmentType"`);
    await queryRunner.query(
      `ALTER TABLE "jobs" RENAME COLUMN "employmentTypeLegacy" TO "employmentType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."jobs_employmenttype_enum"`);
  }
}
