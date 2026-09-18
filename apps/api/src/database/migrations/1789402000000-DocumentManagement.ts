import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentManagement1789402000000 implements MigrationInterface {
  name = 'DocumentManagement1789402000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."documents_category_enum" AS ENUM('resume','cover_letter','portfolio','offer','other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_status_enum" AS ENUM('active','archived','deleted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "storageProvider" character varying NOT NULL DEFAULT 'local'`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "checksum" character varying(64)`,
    );
    await queryRunner.query(
      `UPDATE "documents" SET "checksum" = md5("path" || "id"::text)`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "checksum" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "category" "public"."documents_category_enum" NOT NULL DEFAULT 'other'`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "status" "public"."documents_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(`ALTER TABLE "documents" ADD "replacesId" integer`);
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "candidateId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "applicationId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "archivedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "retentionUntil" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "size" TYPE bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_replaces" FOREIGN KEY ("replacesId") REFERENCES "documents"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_application" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_checksum" ON "documents" ("checksum")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_candidate_created" ON "documents" ("candidateId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_application_created" ON "documents" ("applicationId", "createdAt")`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_documents_application_created"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_candidate_created"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_checksum"`);
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_application"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_candidate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_replaces"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    for (const column of [
      'retentionUntil',
      'deletedAt',
      'archivedAt',
      'applicationId',
      'candidateId',
      'replacesId',
      'version',
      'status',
      'category',
      'checksum',
      'storageProvider',
    ])
      await queryRunner.query(
        `ALTER TABLE "documents" DROP COLUMN "${column}"`,
      );
    await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_category_enum"`);
  }
}
