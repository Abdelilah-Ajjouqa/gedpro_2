import { MigrationInterface, QueryRunner } from 'typeorm';
export class CommunicationAndJobs1789402200000 implements MigrationInterface {
  name = 'CommunicationAndJobs1789402200000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "public"."communications_type_enum" AS ENUM('application_acknowledgement','interview_invitation','interview_reminder','rejection','offer','password_reset','email_verification','custom')`,
    );
    await q.query(
      `CREATE TYPE "public"."communications_status_enum" AS ENUM('queued','sending','sent','delivered','failed','dead_letter','bounced')`,
    );
    await q.query(
      `CREATE TYPE "public"."background_jobs_status_enum" AS ENUM('pending','processing','completed','retry','dead_letter')`,
    );
    await q.query(
      `CREATE TABLE "email_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"key" varchar NOT NULL,"name" varchar NOT NULL,"subject" varchar NOT NULL,"htmlBody" text NOT NULL,"version" integer NOT NULL,"active" boolean NOT NULL DEFAULT true,"createdAt" timestamptz NOT NULL DEFAULT now(),CONSTRAINT "UQ_email_template_version" UNIQUE("key","version"),CONSTRAINT "PK_email_templates" PRIMARY KEY("id"))`,
    );
    await q.query(
      `CREATE INDEX "IDX_email_templates_key" ON "email_templates"("key")`,
    );
    await q.query(
      `CREATE TABLE "communications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"type" "public"."communications_type_enum" NOT NULL,"status" "public"."communications_status_enum" NOT NULL DEFAULT 'queued',"recipient" varchar NOT NULL,"subject" varchar NOT NULL,"htmlBody" text NOT NULL,"idempotencyKey" varchar NOT NULL,"providerMessageId" varchar,"provider" varchar NOT NULL DEFAULT 'log',"attempts" integer NOT NULL DEFAULT 0,"lastError" text,"sentAt" timestamptz,"deliveredAt" timestamptz,"templateId" uuid,"candidateId" integer,"applicationId" integer,"interviewId" integer,"createdById" integer,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now(),CONSTRAINT "UQ_communications_idempotency" UNIQUE("idempotencyKey"),CONSTRAINT "UQ_communications_provider_id" UNIQUE("providerMessageId"),CONSTRAINT "PK_communications" PRIMARY KEY("id"))`,
    );
    await q.query(
      `CREATE TABLE "background_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"queue" varchar NOT NULL,"name" varchar NOT NULL,"payload" jsonb NOT NULL DEFAULT '{}',"status" "public"."background_jobs_status_enum" NOT NULL DEFAULT 'pending',"idempotencyKey" varchar NOT NULL,"attempts" integer NOT NULL DEFAULT 0,"maxAttempts" integer NOT NULL DEFAULT 5,"runAt" timestamptz NOT NULL DEFAULT now(),"lockedAt" timestamptz,"lastError" text,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now(),CONSTRAINT "UQ_background_jobs_idempotency" UNIQUE("idempotencyKey"),CONSTRAINT "PK_background_jobs" PRIMARY KEY("id"))`,
    );
    await q.query(
      `CREATE INDEX "IDX_background_jobs_status_run" ON "background_jobs"("status","runAt")`,
    );
    await q.query(
      `CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"candidateId" integer NOT NULL,"applicationUpdates" boolean NOT NULL DEFAULT true,"interviewUpdates" boolean NOT NULL DEFAULT true,"outcomeUpdates" boolean NOT NULL DEFAULT true,"updatedAt" timestamptz NOT NULL DEFAULT now(),CONSTRAINT "UQ_notification_preferences_candidate" UNIQUE("candidateId"),CONSTRAINT "PK_notification_preferences" PRIMARY KEY("id"))`,
    );
    const fks = [
      ['communications', 'templateId', 'email_templates', 'SET NULL'],
      ['communications', 'candidateId', 'candidates', 'SET NULL'],
      ['communications', 'applicationId', 'applications', 'SET NULL'],
      ['communications', 'interviewId', 'interviews', 'SET NULL'],
      ['communications', 'createdById', 'users', 'SET NULL'],
      ['notification_preferences', 'candidateId', 'candidates', 'CASCADE'],
    ];
    for (const [table, column, target, onDelete] of fks)
      await q.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_${column}" FOREIGN KEY("${column}") REFERENCES "${target}"("id") ON DELETE ${onDelete}`,
      );
    const rows = [
      [
        'application-acknowledgement',
        'Application acknowledgement',
        'We received your application',
        '<p>Hello {{firstName}},</p><p>We received your application for {{jobTitle}}.</p>',
      ],
      [
        'interview-invitation',
        'Interview invitation',
        'Interview invitation for {{jobTitle}}',
        '<p>Hello {{firstName}},</p><p>Your interview is scheduled for {{interviewDate}}.</p>',
      ],
      [
        'interview-reminder',
        'Interview reminder',
        'Interview reminder',
        '<p>Hello {{firstName}},</p><p>This is a reminder for your interview on {{interviewDate}}.</p>',
      ],
      [
        'rejection',
        'Rejection',
        'Update on your application',
        '<p>Hello {{firstName}},</p><p>Thank you for your interest in {{jobTitle}}.</p>',
      ],
      [
        'offer',
        'Offer',
        'Your offer for {{jobTitle}}',
        '<p>Hello {{firstName}},</p><p>We are pleased to make you an offer for {{jobTitle}}.</p>',
      ],
      [
        'password-reset',
        'Password reset',
        'Reset your password',
        '<p>Use this secure link: {{actionUrl}}</p>',
      ],
      [
        'email-verification',
        'Email verification',
        'Verify your email',
        '<p>Use this secure link: {{actionUrl}}</p>',
      ],
      ['custom', 'Custom', '{{subject}}', '<p>{{message}}</p>'],
    ];
    for (const row of rows)
      await q.query(
        `INSERT INTO "email_templates"("key","name","subject","htmlBody","version") VALUES($1,$2,$3,$4,1)`,
        row,
      );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "notification_preferences"`);
    await q.query(`DROP TABLE "background_jobs"`);
    await q.query(`DROP TABLE "communications"`);
    await q.query(`DROP TABLE "email_templates"`);
    await q.query(`DROP TYPE "public"."background_jobs_status_enum"`);
    await q.query(`DROP TYPE "public"."communications_status_enum"`);
    await q.query(`DROP TYPE "public"."communications_type_enum"`);
  }
}
