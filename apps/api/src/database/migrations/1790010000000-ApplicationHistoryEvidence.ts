import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApplicationHistoryEvidence1790010000000 implements MigrationInterface {
  name = 'ApplicationHistoryEvidence1790010000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_history" ADD "kind" character varying NOT NULL DEFAULT 'transitioned'`,
    );
    await queryRunner.query(
      `UPDATE "application_history" SET "kind" = 'created' WHERE "previousStageId" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_history" ADD "rejectionReason" character varying`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_history" DROP COLUMN "rejectionReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_history" DROP COLUMN "kind"`,
    );
  }
}
