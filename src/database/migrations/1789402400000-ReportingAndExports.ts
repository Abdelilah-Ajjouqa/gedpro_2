import { MigrationInterface, QueryRunner } from 'typeorm';
export class ReportingAndExports1789402400000 implements MigrationInterface {
  name = 'ReportingAndExports1789402400000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "public"."report_exports_format_enum" AS ENUM('csv','xlsx')`,
    );
    await q.query(
      `CREATE TYPE "public"."report_exports_status_enum" AS ENUM('pending','processing','completed','failed','expired')`,
    );
    await q.query(
      `CREATE TABLE "report_exports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"requestedById" integer NOT NULL,"format" "public"."report_exports_format_enum" NOT NULL,"status" "public"."report_exports_status_enum" NOT NULL DEFAULT 'pending',"filters" jsonb NOT NULL DEFAULT '{}',"objectKey" varchar,"size" bigint,"error" text,"expiresAt" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"completedAt" timestamptz,CONSTRAINT "PK_report_exports" PRIMARY KEY("id"),CONSTRAINT "FK_report_exports_user" FOREIGN KEY("requestedById") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
    await q.query(
      `CREATE INDEX "IDX_report_exports_user_created" ON "report_exports"("requestedById","createdAt")`,
    );
    await q.query(
      `CREATE INDEX "IDX_application_history_reporting" ON "application_history"("applicationId","changedAt")`,
    );
    await q.query(
      `CREATE INDEX "IDX_applications_reporting" ON "applications"("jobId","createdAt")`,
    );
    await q.query(
      `CREATE INDEX "IDX_interviews_reporting" ON "interviews"("interviewerId","date")`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "IDX_interviews_reporting"`);
    await q.query(`DROP INDEX "IDX_applications_reporting"`);
    await q.query(`DROP INDEX "IDX_application_history_reporting"`);
    await q.query(`DROP INDEX "IDX_report_exports_user_created"`);
    await q.query(`DROP TABLE "report_exports"`);
    await q.query(`DROP TYPE "public"."report_exports_status_enum"`);
    await q.query(`DROP TYPE "public"."report_exports_format_enum"`);
  }
}
