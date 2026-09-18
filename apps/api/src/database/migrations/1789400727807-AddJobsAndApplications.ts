import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobsAndApplications1789400727807 implements MigrationInterface {
  name = 'AddJobsAndApplications1789400727807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."application_history_previousstage_enum" AS ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."application_history_newstage_enum" AS ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_history" ("id" SERIAL NOT NULL, "previousStage" "public"."application_history_previousstage_enum", "newStage" "public"."application_history_newstage_enum" NOT NULL, "comment" character varying, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicationId" integer NOT NULL, "changedById" integer NOT NULL, CONSTRAINT "PK_cfaef81d8ab33ced714ecda2486" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."applications_currentstage_enum" AS ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" ("id" SERIAL NOT NULL, "currentStage" "public"."applications_currentstage_enum" NOT NULL DEFAULT 'applied', "source" character varying, "rejectionReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "candidateId" integer NOT NULL, "jobId" integer NOT NULL, "ownerId" integer, CONSTRAINT "UQ_b005ac451f3e0550c2c8cb5bbaa" UNIQUE ("candidateId", "jobId"), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('draft', 'published', 'closed', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "department" character varying, "location" character varying, "employmentType" character varying, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMP, "closedAt" TIMESTAMP, "ownerId" integer NOT NULL, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_history" ADD CONSTRAINT "FK_54776102ca0df37e15b7d16af4f" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_history" ADD CONSTRAINT "FK_96a7ea4dded70fac778a4e8aa93" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_d88cfc3ec1f66c6c7b55d79f025" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_f56229956adaac39fa9864f5f59" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_f56229956adaac39fa9864f5f59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_d88cfc3ec1f66c6c7b55d79f025"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_history" DROP CONSTRAINT "FK_96a7ea4dded70fac778a4e8aa93"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_history" DROP CONSTRAINT "FK_54776102ca0df37e15b7d16af4f"`,
    );
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(
      `DROP TYPE "public"."applications_currentstage_enum"`,
    );
    await queryRunner.query(`DROP TABLE "application_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."application_history_newstage_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."application_history_previousstage_enum"`,
    );
  }
}
