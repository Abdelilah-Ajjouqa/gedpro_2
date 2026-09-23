import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhaseFiveInterviews1790610000000 implements MigrationInterface {
  name = 'PhaseFiveInterviews1790610000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "timezone" character varying NOT NULL DEFAULT 'UTC'`,
    );
    await queryRunner.query(
      'ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "outcomeReason" text',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_interviews_date_id" ON "interviews" ("date", "id")',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_interviews_date_id"');
    await queryRunner.query(
      'ALTER TABLE "interviews" DROP COLUMN IF EXISTS "outcomeReason"',
    );
    await queryRunner.query(
      'ALTER TABLE "interviews" DROP COLUMN IF EXISTS "timezone"',
    );
    await queryRunner.query(
      'ALTER TABLE "interviews" DROP COLUMN IF EXISTS "version"',
    );
  }
}
