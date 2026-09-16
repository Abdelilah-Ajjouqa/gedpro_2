import { MigrationInterface, QueryRunner } from 'typeorm';

export class InterviewsAndScorecards1789401800000 implements MigrationInterface {
  name = 'InterviewsAndScorecards1789401800000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."interviews_status_enum" ADD VALUE IF NOT EXISTS 'NO_SHOW'`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ALTER COLUMN "date" TYPE TIMESTAMPTZ USING "date" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "round" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "title" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "feedbackDeadline" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "hideFeedbackUntilComplete" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "calendarProvider" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "calendarEventId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "calendarSyncStatus" character varying NOT NULL DEFAULT 'not_requested'`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "calendarSyncError" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD "applicationId" integer`,
    );
    await queryRunner.query(
      `UPDATE "interviews" i SET "applicationId"=(SELECT a.id FROM "applications" a WHERE a."candidateId"=i."candidateId" ORDER BY a."createdAt" DESC LIMIT 1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_interviews_application" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE TABLE "scorecard_templates" ("id" SERIAL NOT NULL, "name" varchar NOT NULL, "description" text, "criteria" jsonb NOT NULL, "archived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "jobId" integer, "stageId" integer, CONSTRAINT "PK_scorecard_templates" PRIMARY KEY ("id"), CONSTRAINT "FK_scorecard_template_job" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE, CONSTRAINT "FK_scorecard_template_stage" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."scorecards_recommendation_enum" AS ENUM('strong_no','no','yes','strong_yes')`,
    );
    await queryRunner.query(
      `CREATE TABLE "scorecards" ("id" SERIAL NOT NULL, "ratings" jsonb, "recommendation" "public"."scorecards_recommendation_enum", "privateNotes" text, "submittedAt" TIMESTAMPTZ, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "interviewId" integer NOT NULL, "reviewerId" integer NOT NULL, "templateId" integer NOT NULL, CONSTRAINT "UQ_scorecard_interview_reviewer" UNIQUE ("interviewId","reviewerId"), CONSTRAINT "PK_scorecards" PRIMARY KEY ("id"), CONSTRAINT "FK_scorecard_interview" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE, CONSTRAINT "FK_scorecard_reviewer" FOREIGN KEY ("reviewerId") REFERENCES "users"("id"), CONSTRAINT "FK_scorecard_template" FOREIGN KEY ("templateId") REFERENCES "scorecard_templates"("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interview_availability" ON "interviews" ("date", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_scorecard_missing" ON "scorecards" ("interviewId", "submittedAt")`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_scorecard_missing"`);
    await queryRunner.query(`DROP INDEX "IDX_interview_availability"`);
    await queryRunner.query(`DROP TABLE "scorecards"`);
    await queryRunner.query(
      `DROP TYPE "public"."scorecards_recommendation_enum"`,
    );
    await queryRunner.query(`DROP TABLE "scorecard_templates"`);
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_interviews_application"`,
    );
    for (const column of [
      'applicationId',
      'calendarSyncError',
      'calendarSyncStatus',
      'calendarEventId',
      'calendarProvider',
      'hideFeedbackUntilComplete',
      'feedbackDeadline',
      'title',
      'round',
    ])
      await queryRunner.query(
        `ALTER TABLE "interviews" DROP COLUMN "${column}"`,
      );
    await queryRunner.query(
      `ALTER TABLE "interviews" ALTER COLUMN "date" TYPE TIMESTAMP USING "date" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."interviews_status_enum" RENAME TO "interviews_status_enum_old"`,
    );
    await queryRunner.query(
      `UPDATE "interviews" SET "status"='CANCELLED' WHERE "status"='NO_SHOW'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_status_enum" AS ENUM('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ALTER COLUMN "status" TYPE "public"."interviews_status_enum" USING "status"::text::"public"."interviews_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`,
    );
    await queryRunner.query(`DROP TYPE "public"."interviews_status_enum_old"`);
  }
}
