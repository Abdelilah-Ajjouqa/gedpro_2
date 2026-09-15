import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthenticationSecurity1789401000000 implements MigrationInterface {
  name = 'AuthenticationSecurity1789401000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD "failedLoginAttempts" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "users" ADD "lockedUntil" TIMESTAMP`);
    await queryRunner.query(`CREATE TYPE "public"."auth_action_tokens_type_enum" AS ENUM('password_reset', 'email_verification')`);
    await queryRunner.query(`CREATE TABLE "auth_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "refreshTokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_auth_sessions" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_auth_sessions_expires" ON "auth_sessions" ("expiresAt")`);
    await queryRunner.query(`CREATE TABLE "auth_action_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying NOT NULL, "type" "public"."auth_action_tokens_type_enum" NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_auth_action_token_hash" UNIQUE ("tokenHash"), CONSTRAINT "PK_auth_action_tokens" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_auth_action_token_hash" ON "auth_action_tokens" ("tokenHash")`);
    await queryRunner.query(`CREATE TABLE "security_audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer, "event" character varying NOT NULL, "ipAddress" character varying, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_security_audit_events" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_security_audit_user" ON "security_audit_events" ("userId")`);
    await queryRunner.query(`ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "auth_action_tokens" ADD CONSTRAINT "FK_auth_action_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_action_tokens" DROP CONSTRAINT "FK_auth_action_tokens_user"`);
    await queryRunner.query(`ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_auth_sessions_user"`);
    await queryRunner.query(`DROP TABLE "security_audit_events"`);
    await queryRunner.query(`DROP TABLE "auth_action_tokens"`);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
    await queryRunner.query(`DROP TYPE "public"."auth_action_tokens_type_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lockedUntil"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failedLoginAttempts"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
  }
}
