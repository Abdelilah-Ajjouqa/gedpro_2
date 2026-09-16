import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResponsibleAi1789402800000 implements MigrationInterface {
  name = 'ResponsibleAi1789402800000';
  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "public"."ai_generations_type_enum" AS ENUM('cv_extraction','search','job_match','interview_questions','application_summary')`,
    );
    await q.query(
      `CREATE TABLE "ai_generations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."ai_generations_type_enum" NOT NULL, "model" character varying NOT NULL, "promptVersion" character varying NOT NULL, "input" jsonb NOT NULL DEFAULT '{}', "output" jsonb NOT NULL DEFAULT '{}', "latencyMs" integer NOT NULL DEFAULT '0', "inputTokens" integer NOT NULL DEFAULT '0', "outputTokens" integer NOT NULL DEFAULT '0', "costUsd" numeric(12,6) NOT NULL DEFAULT '0', "advisory" boolean NOT NULL DEFAULT true, "protectedInputsExcluded" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "requestedById" integer, CONSTRAINT "PK_ai_generations" PRIMARY KEY ("id"))`,
    );
    await q.query(
      `CREATE INDEX "IDX_ai_generations_type_created" ON "ai_generations" ("type", "createdAt")`,
    );
    await q.query(
      `CREATE TABLE "cv_extractions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "extracted" jsonb NOT NULL, "corrected" jsonb, "correctedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "candidateId" integer NOT NULL, "documentId" integer, "generationId" uuid NOT NULL, "correctedById" integer, CONSTRAINT "PK_cv_extractions" PRIMARY KEY ("id"))`,
    );
    await q.query(
      `CREATE TABLE "ai_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" smallint NOT NULL, "comment" text, "override" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "generationId" uuid NOT NULL, "reviewerId" integer, CONSTRAINT "UQ_ai_feedback_generation_reviewer" UNIQUE ("generationId", "reviewerId"), CONSTRAINT "CHK_ai_feedback_rating" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_ai_feedback" PRIMARY KEY ("id"))`,
    );
    await q.query(
      `ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_ai_generation_user" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" ADD CONSTRAINT "FK_cv_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" ADD CONSTRAINT "FK_cv_document" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" ADD CONSTRAINT "FK_cv_generation" FOREIGN KEY ("generationId") REFERENCES "ai_generations"("id") ON DELETE CASCADE`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" ADD CONSTRAINT "FK_cv_corrector" FOREIGN KEY ("correctedById") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
    await q.query(
      `ALTER TABLE "ai_feedback" ADD CONSTRAINT "FK_ai_feedback_generation" FOREIGN KEY ("generationId") REFERENCES "ai_generations"("id") ON DELETE CASCADE`,
    );
    await q.query(
      `ALTER TABLE "ai_feedback" ADD CONSTRAINT "FK_ai_feedback_reviewer" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "ai_feedback" DROP CONSTRAINT "FK_ai_feedback_reviewer"`,
    );
    await q.query(
      `ALTER TABLE "ai_feedback" DROP CONSTRAINT "FK_ai_feedback_generation"`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" DROP CONSTRAINT "FK_cv_corrector"`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" DROP CONSTRAINT "FK_cv_generation"`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" DROP CONSTRAINT "FK_cv_document"`,
    );
    await q.query(
      `ALTER TABLE "cv_extractions" DROP CONSTRAINT "FK_cv_candidate"`,
    );
    await q.query(
      `ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_ai_generation_user"`,
    );
    await q.query(`DROP TABLE "ai_feedback"`);
    await q.query(`DROP TABLE "cv_extractions"`);
    await q.query(`DROP INDEX "IDX_ai_generations_type_created"`);
    await q.query(`DROP TABLE "ai_generations"`);
    await q.query(`DROP TYPE "public"."ai_generations_type_enum"`);
  }
}
