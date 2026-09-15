import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifiedActivityTimeline1789401600000 implements MigrationInterface {
  name = 'UnifiedActivityTimeline1789401600000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "public"."timeline_events_visibility_enum" AS ENUM('internal','candidate')`,
    );
    await q.query(
      `CREATE TYPE "public"."timeline_events_targettype_enum" AS ENUM('candidate','application')`,
    );
    await q.query(
      `CREATE TABLE "timeline_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" varchar NOT NULL, "actorId" integer, "actorName" varchar, "visibility" "public"."timeline_events_visibility_enum" NOT NULL DEFAULT 'internal', "targetType" "public"."timeline_events_targettype_enum" NOT NULL, "targetId" integer NOT NULL, "candidateId" integer NOT NULL, "applicationId" integer, "sourceType" varchar, "sourceId" varchar, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_timeline_events" PRIMARY KEY ("id"))`,
    );
    await q.query(
      `CREATE INDEX "IDX_timeline_candidate_cursor" ON "timeline_events" ("candidateId", "createdAt", "id")`,
    );
    await q.query(
      `CREATE INDEX "IDX_timeline_application_cursor" ON "timeline_events" ("applicationId", "createdAt", "id")`,
    );
    await q.query(
      `INSERT INTO "timeline_events" ("type","actorId","actorName","visibility","targetType","targetId","candidateId","applicationId","sourceType","sourceId","metadata","createdAt") SELECT CASE WHEN h."previousStageId" IS NULL THEN 'application.created' ELSE 'application.stage_changed' END, h."changedById", trim(concat(u."firstName",' ',u."lastName")), 'candidate', 'application', a.id, a."candidateId", a.id, 'application_history', h.id::varchar, jsonb_build_object('previousStageId',h."previousStageId",'newStageId',h."newStageId",'comment',h.comment), h."changedAt" FROM "application_history" h JOIN "applications" a ON a.id=h."applicationId" LEFT JOIN "users" u ON u.id=h."changedById"`,
    );
    await q.query(
      `INSERT INTO "timeline_events" ("type","actorId","actorName","visibility","targetType","targetId","candidateId","sourceType","sourceId","metadata","createdAt") SELECT 'candidate.state_changed', h."changedById", trim(concat(u."firstName",' ',u."lastName")), 'candidate', 'candidate', h."candidateId", h."candidateId", 'candidate_history', h.id::varchar, jsonb_build_object('previousState',h."previousState",'newState',h."newState",'comment',h.comment), h."changedAt" FROM "candidate_history" h LEFT JOIN "users" u ON u.id=h."changedById"`,
    );
    await q.query(
      `INSERT INTO "timeline_events" ("type","actorId","actorName","visibility","targetType","targetId","candidateId","sourceType","sourceId","metadata","createdAt") SELECT 'interview.scheduled', i."interviewerId", trim(concat(u."firstName",' ',u."lastName")), 'candidate', 'candidate', i."candidateId", i."candidateId", 'interview', i.id::varchar, jsonb_build_object('interviewId',i.id,'date',i.date,'duration',i.duration,'interviewType',i.type,'status',i.status), i."createdAt" FROM "interviews" i LEFT JOIN "users" u ON u.id=i."interviewerId"`,
    );
    await q.query(
      `INSERT INTO "timeline_events" ("type","actorId","actorName","visibility","targetType","targetId","candidateId","sourceType","sourceId","metadata","createdAt") SELECT s.event, s."userId", trim(concat(u."firstName",' ',u."lastName")), 'internal', 'candidate', (s.metadata->>'candidateId')::integer, (s.metadata->>'candidateId')::integer, 'security_audit_event', s.id::varchar, s.metadata, s."createdAt" FROM "security_audit_events" s LEFT JOIN "users" u ON u.id=s."userId" WHERE s.metadata ? 'candidateId' AND (s.metadata->>'candidateId') ~ '^[0-9]+$'`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "IDX_timeline_application_cursor"`);
    await q.query(`DROP INDEX "IDX_timeline_candidate_cursor"`);
    await q.query(`DROP TABLE "timeline_events"`);
    await q.query(`DROP TYPE "public"."timeline_events_targettype_enum"`);
    await q.query(`DROP TYPE "public"."timeline_events_visibility_enum"`);
  }
}
