import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentRevision1789403000000 implements MigrationInterface {
  name = 'DocumentRevision1789403000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "revision" integer NOT NULL DEFAULT 1`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "revision"`);
  }
}
