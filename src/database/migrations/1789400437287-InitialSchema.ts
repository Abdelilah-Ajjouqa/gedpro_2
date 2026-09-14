import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789400437287 implements MigrationInterface {
    name = 'InitialSchema1789400437287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'rh', 'manager', 'candidate')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "role" "public"."users_role_enum" NOT NULL DEFAULT 'candidate', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" SERIAL NOT NULL, "originalName" character varying NOT NULL, "filename" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "path" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."candidate_history_previousstate_enum" AS ENUM('new', 'preselected', 'interview_scheduled', 'in_interview', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TYPE "public"."candidate_history_newstate_enum" AS ENUM('new', 'preselected', 'interview_scheduled', 'in_interview', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "candidate_history" ("id" SERIAL NOT NULL, "previousState" "public"."candidate_history_previousstate_enum" NOT NULL, "newState" "public"."candidate_history_newstate_enum" NOT NULL, "comment" character varying, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), "candidateId" integer, "changedById" integer, CONSTRAINT "PK_9a7ae39cc6784b6e9e4bbf9c9f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."candidates_currentstate_enum" AS ENUM('new', 'preselected', 'interview_scheduled', 'in_interview', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "candidates" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "currentState" "public"."candidates_currentstate_enum" NOT NULL DEFAULT 'new', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c0de76a18c2a505ceb016746822" UNIQUE ("email"), CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."interviews_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')`);
        await queryRunner.query(`CREATE TYPE "public"."interviews_type_enum" AS ENUM('HR', 'TECHNICAL', 'FINAL')`);
        await queryRunner.query(`CREATE TABLE "interviews" ("id" SERIAL NOT NULL, "date" TIMESTAMP NOT NULL, "duration" integer NOT NULL DEFAULT '60', "status" "public"."interviews_status_enum" NOT NULL DEFAULT 'SCHEDULED', "type" "public"."interviews_type_enum" NOT NULL DEFAULT 'HR', "location" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "candidateId" integer, "interviewerId" integer, CONSTRAINT "PK_fd41af1f96d698fa33c2f070f47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles_permissions_permissions" ("rolesId" integer NOT NULL, "permissionsId" integer NOT NULL, CONSTRAINT "PK_b2f4e3f7fbeb7e5b495dd819842" PRIMARY KEY ("rolesId", "permissionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc2b9d46195bb3ed28abbf7c9e" ON "roles_permissions_permissions" ("rolesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd4d5d4c7f7ff16c57549b72c6" ON "roles_permissions_permissions" ("permissionsId") `);
        await queryRunner.query(`CREATE TABLE "interviews_attendees_users" ("interviewsId" integer NOT NULL, "usersId" integer NOT NULL, CONSTRAINT "PK_b67a29442314653c94a61d80fed" PRIMARY KEY ("interviewsId", "usersId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f0888a11648c97d2c931a59c5" ON "interviews_attendees_users" ("interviewsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3b0f88c3d4d1ce669b5089b162" ON "interviews_attendees_users" ("usersId") `);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_history" ADD CONSTRAINT "FK_a51e98e929f0970064ab89a7ee1" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_history" ADD CONSTRAINT "FK_7ac642cce2dad6ff4948f843ca3" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interviews" ADD CONSTRAINT "FK_9b47fb5a4e06ccb14d20d2f06fd" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interviews" ADD CONSTRAINT "FK_ce9b9d12ec0ba8ee7d653d1fee8" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" ADD CONSTRAINT "FK_dc2b9d46195bb3ed28abbf7c9e3" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" ADD CONSTRAINT "FK_fd4d5d4c7f7ff16c57549b72c6f" FOREIGN KEY ("permissionsId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interviews_attendees_users" ADD CONSTRAINT "FK_0f0888a11648c97d2c931a59c5e" FOREIGN KEY ("interviewsId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "interviews_attendees_users" ADD CONSTRAINT "FK_3b0f88c3d4d1ce669b5089b1628" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interviews_attendees_users" DROP CONSTRAINT "FK_3b0f88c3d4d1ce669b5089b1628"`);
        await queryRunner.query(`ALTER TABLE "interviews_attendees_users" DROP CONSTRAINT "FK_0f0888a11648c97d2c931a59c5e"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" DROP CONSTRAINT "FK_fd4d5d4c7f7ff16c57549b72c6f"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" DROP CONSTRAINT "FK_dc2b9d46195bb3ed28abbf7c9e3"`);
        await queryRunner.query(`ALTER TABLE "interviews" DROP CONSTRAINT "FK_ce9b9d12ec0ba8ee7d653d1fee8"`);
        await queryRunner.query(`ALTER TABLE "interviews" DROP CONSTRAINT "FK_9b47fb5a4e06ccb14d20d2f06fd"`);
        await queryRunner.query(`ALTER TABLE "candidate_history" DROP CONSTRAINT "FK_7ac642cce2dad6ff4948f843ca3"`);
        await queryRunner.query(`ALTER TABLE "candidate_history" DROP CONSTRAINT "FK_a51e98e929f0970064ab89a7ee1"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b0f88c3d4d1ce669b5089b162"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f0888a11648c97d2c931a59c5"`);
        await queryRunner.query(`DROP TABLE "interviews_attendees_users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd4d5d4c7f7ff16c57549b72c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc2b9d46195bb3ed28abbf7c9e"`);
        await queryRunner.query(`DROP TABLE "roles_permissions_permissions"`);
        await queryRunner.query(`DROP TABLE "interviews"`);
        await queryRunner.query(`DROP TYPE "public"."interviews_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."interviews_status_enum"`);
        await queryRunner.query(`DROP TABLE "candidates"`);
        await queryRunner.query(`DROP TYPE "public"."candidates_currentstate_enum"`);
        await queryRunner.query(`DROP TABLE "candidate_history"`);
        await queryRunner.query(`DROP TYPE "public"."candidate_history_newstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."candidate_history_previousstate_enum"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
