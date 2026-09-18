import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionReadinessIndexes1789402600000 implements MigrationInterface {
  name = 'ProductionReadinessIndexes1789402600000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE INDEX "IDX_candidates_active_created" ON "candidates" ("archivedAt", "createdAt" DESC)`,
    );
    await q.query(
      `CREATE INDEX "IDX_jobs_status_created" ON "jobs" ("status", "createdAt" DESC)`,
    );
    await q.query(
      `CREATE INDEX "IDX_applications_job_stage_created" ON "applications" ("jobId", "currentStageId", "createdAt" DESC)`,
    );
    await q.query(
      `CREATE INDEX "IDX_applications_candidate_created" ON "applications" ("candidateId", "createdAt" DESC)`,
    );
    await q.query(
      `CREATE INDEX "IDX_interviews_date_status" ON "interviews" ("date", "status")`,
    );
    await q.query(
      `CREATE INDEX "IDX_background_jobs_poll" ON "background_jobs" ("status", "runAt", "createdAt")`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "IDX_background_jobs_poll"`);
    await q.query(`DROP INDEX "IDX_interviews_date_status"`);
    await q.query(`DROP INDEX "IDX_applications_candidate_created"`);
    await q.query(`DROP INDEX "IDX_applications_job_stage_created"`);
    await q.query(`DROP INDEX "IDX_jobs_status_created"`);
    await q.query(`DROP INDEX "IDX_candidates_active_created"`);
  }
}
