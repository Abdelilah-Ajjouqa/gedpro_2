import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/users/enums/role.enum';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Job } from '../src/jobs/entities/job.entity';
import { Candidate } from '../src/candidates/entities/candidate.entity';
import { Pipeline } from '../src/pipelines/entities/pipeline.entity';

describe('GEDPro health (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect({ status: 'ready', postgres: 'up', mongodb: 'up' });
  });

  it('runs a custom pipeline application workflow', async () => {
    const suffix = randomUUID();
    const admin = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        firstName: 'E2E',
        lastName: 'Admin',
        email: `${suffix}@example.com`,
        password: await bcrypt.hash('E2ePassword123!', 4),
        role: Role.ADMIN,
      }),
    );
    let jobId: number | undefined;
    let candidateId: number | undefined;
    let mergedSourceId: number | undefined;
    let pipelineId: number | undefined;
    try {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: admin.email, password: 'E2ePassword123!' })
        .expect(200);
      const auth = { Authorization: `Bearer ${login.body.accessToken}` };
      const pipeline = await request(app.getHttpServer())
        .post('/pipelines')
        .set(auth)
        .send({
          name: `Engineering ${suffix}`,
          stages: [
            { name: 'Applied', category: 'applied', position: 1 },
            { name: 'Technical review', category: 'screening', position: 2 },
            { name: 'Rejected', category: 'rejected', position: 3 },
          ],
        })
        .expect(201);
      pipelineId = pipeline.body.id;
      const [applied, screening] = pipeline.body.stages;
      await request(app.getHttpServer())
        .put(`/pipelines/${pipelineId}/stages/${applied.id}/transitions`)
        .set(auth)
        .send({ toStageIds: [screening.id] })
        .expect(200);
      const job = await request(app.getHttpServer())
        .post('/jobs')
        .set(auth)
        .send({
          pipelineId,
          title: 'E2E Engineer',
          description: 'Pipeline verification',
        })
        .expect(201);
      jobId = job.body.id;
      await request(app.getHttpServer())
        .post(`/jobs/${jobId}/publish`)
        .set(auth)
        .expect(201);
      const candidate = await request(app.getHttpServer())
        .post('/candidates')
        .set(auth)
        .send({
          firstName: 'E2E',
          lastName: 'Candidate',
          email: `candidate-${suffix}@example.com`,
        })
        .expect(201);
      candidateId = candidate.body.id;
      await request(app.getHttpServer())
        .patch(`/candidates/${candidateId}`)
        .set(auth)
        .send({
          tags: ['Priority', 'priority'],
          skills: ['TypeScript'],
          source: 'referral',
          privacyConsent: true,
        })
        .expect(200);
      const search = await request(app.getHttpServer())
        .get('/candidates')
        .query({ search: `candidate-${suffix}`, skill: 'typescript' })
        .set(auth)
        .expect(200);
      expect(search.body.total).toBe(1);
      const application = await request(app.getHttpServer())
        .post('/applications')
        .set(auth)
        .send({ jobId, candidateId })
        .expect(201);
      const queuedMessage = await request(app.getHttpServer())
        .post('/communications')
        .set(auth)
        .send({
          type: 'custom',
          recipient: candidate.body.email,
          candidateId,
          applicationId: application.body.id,
          variables: { subject: 'Next steps', message: '<b>Welcome</b>' },
          idempotencyKey: `e2e-${suffix}-custom`,
        })
        .expect(201);
      const duplicateMessage = await request(app.getHttpServer())
        .post('/communications')
        .set(auth)
        .send({
          type: 'custom',
          recipient: candidate.body.email,
          candidateId,
          applicationId: application.body.id,
          variables: { subject: 'Changed', message: 'Must not duplicate' },
          idempotencyKey: `e2e-${suffix}-custom`,
        })
        .expect(201);
      expect(duplicateMessage.body.id).toBe(queuedMessage.body.id);
      const communicationHistory = await request(app.getHttpServer())
        .get('/communications')
        .query({ applicationId: application.body.id })
        .set(auth)
        .expect(200);
      expect(communicationHistory.body.map((row: any) => row.id)).toContain(
        queuedMessage.body.id,
      );
      const document = await request(app.getHttpServer())
        .post('/documents/upload')
        .set(auth)
        .field('applicationId', application.body.id)
        .field('category', 'resume')
        .attach('file', Buffer.from('%PDF-1.4 e2e resume'), 'resume.pdf')
        .expect(201);
      expect(document.body).toMatchObject({
        category: 'resume',
        version: 1,
        mimeType: 'application/pdf',
      });
      expect(document.body.path).toBeUndefined();
      await request(app.getHttpServer())
        .get(`/documents/${document.body.id}/download?preview=true`)
        .set(auth)
        .expect('Content-Type', /application\/pdf/)
        .expect(200);
      const signed = await request(app.getHttpServer())
        .get(`/documents/${document.body.id}/url`)
        .set(auth)
        .expect(200);
      await request(app.getHttpServer())
        .get(signed.body.url)
        .expect('Content-Type', /application\/pdf/)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/document-download/${document.body.id}?token=1.invalid`)
        .expect(403);
      await request(app.getHttpServer())
        .post('/documents/upload')
        .set(auth)
        .field('candidateId', candidateId)
        .attach('file', Buffer.from('%PDF-1.4 e2e resume'), 'copy.pdf')
        .expect(409);
      const replacement = await request(app.getHttpServer())
        .post(`/documents/${document.body.id}/replace`)
        .set(auth)
        .attach('file', Buffer.from('%PDF-1.4 updated resume'), 'resume-v2.pdf')
        .expect(201);
      expect(replacement.body).toMatchObject({ version: 2 });
      await request(app.getHttpServer())
        .patch(`/documents/${replacement.body.id}/archive`)
        .set(auth)
        .expect(200);
      const moved = await request(app.getHttpServer())
        .patch(`/applications/${application.body.id}/stage`)
        .set(auth)
        .send({ stageId: screening.id, comment: 'Qualified' })
        .expect(200);
      expect(moved.body.currentStage.id).toBe(screening.id);
      const template = await request(app.getHttpServer())
        .post('/interviews/scorecard-templates')
        .set(auth)
        .send({
          name: 'Engineering scorecard',
          jobId,
          stageId: screening.id,
          criteria: [
            {
              key: 'technical',
              label: 'Technical ability',
              minRating: 1,
              maxRating: 5,
            },
          ],
        })
        .expect(201);
      const interviewDate = new Date(Date.now() + 7 * 86400000).toISOString();
      const interview = await request(app.getHttpServer())
        .post('/interviews')
        .set(auth)
        .send({
          candidateId,
          applicationId: application.body.id,
          date: interviewDate,
          interviewerIds: [admin.id],
          round: 1,
          scorecardTemplateId: template.body.id,
          hideFeedbackUntilComplete: true,
          feedbackDeadline: new Date(Date.now() + 8 * 86400000).toISOString(),
          calendarProvider: 'internal',
        })
        .expect(201);
      expect(interview.body.calendarSyncStatus).toBe('synced');
      expect(interview.body.scorecards).toHaveLength(1);
      await request(app.getHttpServer())
        .post('/interviews')
        .set(auth)
        .send({
          candidateId,
          applicationId: application.body.id,
          date: interviewDate,
          interviewerIds: [admin.id],
        })
        .expect(409);
      await request(app.getHttpServer())
        .patch(`/interviews/${interview.body.id}/reschedule`)
        .set(auth)
        .send({ date: new Date(Date.now() + 9 * 86400000).toISOString() })
        .expect(200);
      await request(app.getHttpServer())
        .post(
          `/interviews/scorecards/${interview.body.scorecards[0].id}/submit`,
        )
        .set(auth)
        .send({
          ratings: { technical: 5 },
          recommendation: 'strong_yes',
          privateNotes: 'Excellent signal',
        })
        .expect(201);
      const decision = await request(app.getHttpServer())
        .get(`/interviews/applications/${application.body.id}/decision-summary`)
        .set(auth)
        .expect(200);
      expect(decision.body).toMatchObject({ complete: 1, missing: [] });
      await request(app.getHttpServer())
        .patch(`/interviews/${interview.body.id}/outcome`)
        .set(auth)
        .send({ status: 'COMPLETED' })
        .expect(200);
      const form = await request(app.getHttpServer())
        .post('/forms')
        .set(auth)
        .send({
          title: 'Technical evaluation',
          fields: [
            {
              id: 'recommendation',
              label: 'Recommendation',
              type: 'select',
              required: true,
              options: ['hire', 'reject'],
            },
            {
              id: 'notes',
              label: 'Notes',
              type: 'text',
              required: true,
              condition: {
                fieldId: 'recommendation',
                operator: 'equals',
                value: 'hire',
              },
            },
          ],
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/forms/${form.body._id}/publish`)
        .set(auth)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/forms/${form.body._id}/assignments`)
        .set(auth)
        .send({ stageId: screening.id })
        .expect(201);
      const assignedForms = await request(app.getHttpServer())
        .get(`/forms/assignments/application/${application.body.id}`)
        .set(auth)
        .expect(200);
      expect(assignedForms.body.map((item: any) => item._id)).toContain(
        form.body._id,
      );
      await request(app.getHttpServer())
        .post(`/forms/${form.body._id}/submit`)
        .set(auth)
        .send({
          applicationId: application.body.id,
          answers: { recommendation: 'hire' },
        })
        .expect(400);
      const response = await request(app.getHttpServer())
        .post(`/forms/${form.body._id}/submit`)
        .set(auth)
        .send({
          applicationId: application.body.id,
          answers: { recommendation: 'hire', notes: 'Strong result' },
        })
        .expect(201);
      await request(app.getHttpServer())
        .put(`/forms/${form.body._id}`)
        .set(auth)
        .send({
          title: 'Technical evaluation v2',
          fields: [
            {
              id: 'recommendation',
              label: 'Recommendation',
              type: 'select',
              required: true,
              options: ['hire', 'reject', 'hold'],
            },
          ],
        })
        .expect(200);
      const responses = await request(app.getHttpServer())
        .get(`/forms/${form.body._id}/responses`)
        .set(auth)
        .expect(200);
      expect(responses.body.data[0]).toMatchObject({
        _id: response.body._id,
        formVersion: 1,
        formTitle: 'Technical evaluation',
      });
      expect(responses.body.data[0].fieldsSnapshot).toHaveLength(2);
      await request(app.getHttpServer())
        .patch(`/forms/${form.body._id}/responses/${response.body._id}/review`)
        .set(auth)
        .send({ status: 'approved', notes: 'Reviewed' })
        .expect(200);
      await request(app.getHttpServer())
        .get(`/forms/${form.body._id}/responses/export`)
        .set(auth)
        .expect('Content-Type', /text\/csv/)
        .expect(200);
      await request(app.getHttpServer())
        .post(`/applications/${application.body.id}/timeline/notes`)
        .set(auth)
        .send({ text: 'Recruiter-only calibration note' })
        .expect(201);
      const timeline = await request(app.getHttpServer())
        .get(`/applications/${application.body.id}/timeline`)
        .query({ limit: 2 })
        .set(auth)
        .expect(200);
      expect(timeline.body.data.map((event: any) => event.type)).toContain(
        'note.created',
      );
      expect(timeline.body.nextCursor).toEqual(expect.any(String));
      const nextPage = await request(app.getHttpServer())
        .get(`/applications/${application.body.id}/timeline`)
        .query({ limit: 2, cursor: timeline.body.nextCursor })
        .set(auth)
        .expect(200);
      expect(
        nextPage.body.data.every(
          (event: any) =>
            !timeline.body.data.some((first: any) => first.id === event.id),
        ),
      ).toBe(true);
      const source = await request(app.getHttpServer())
        .post('/candidates')
        .set(auth)
        .send({
          firstName: 'Duplicate',
          lastName: 'Record',
          email: `duplicate-${suffix}@example.com`,
          skills: ['NestJS'],
        })
        .expect(201);
      mergedSourceId = source.body.id;
      await request(app.getHttpServer())
        .post(`/candidates/${candidateId}/merge`)
        .set(auth)
        .send({ sourceCandidateId: mergedSourceId })
        .expect(201);
      await request(app.getHttpServer())
        .get(`/candidates/${mergedSourceId}`)
        .set(auth)
        .expect(404);
      const exported = await request(app.getHttpServer())
        .get(`/candidates/${candidateId}/privacy/export`)
        .set(auth)
        .expect(200);
      expect(exported.body.applications).toHaveLength(1);
      await request(app.getHttpServer())
        .post(`/candidates/${candidateId}/archive`)
        .set(auth)
        .expect(201);
      await request(app.getHttpServer())
        .get(`/candidates/${candidateId}`)
        .set(auth)
        .expect(404);
      await request(app.getHttpServer())
        .post(`/candidates/${candidateId}/restore`)
        .set(auth)
        .expect(201);
    } finally {
      if (mergedSourceId)
        await dataSource.getRepository(Candidate).delete(mergedSourceId);
      if (candidateId)
        await dataSource.getRepository(Candidate).delete(candidateId);
      if (jobId) await dataSource.getRepository(Job).delete(jobId);
      if (pipelineId)
        await dataSource.getRepository(Pipeline).delete(pipelineId);
      await dataSource.getRepository(User).delete(admin.id);
    }
  });
});
