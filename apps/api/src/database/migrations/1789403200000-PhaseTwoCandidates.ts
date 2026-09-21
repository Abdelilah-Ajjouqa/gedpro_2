import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhaseTwoCandidates1789403200000 implements MigrationInterface {
  name = 'PhaseTwoCandidates1789403200000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "erasedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_candidates_disposition_updated" ON "candidates" ("archivedAt", "updatedAt", "id")`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_candidates_disposition_updated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP COLUMN IF EXISTS "erasedAt"`,
    );
  }
}
