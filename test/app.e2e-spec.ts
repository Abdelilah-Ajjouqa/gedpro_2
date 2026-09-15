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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
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
    const admin = await dataSource.getRepository(User).save(dataSource.getRepository(User).create({ firstName: 'E2E', lastName: 'Admin', email: `${suffix}@example.com`, password: await bcrypt.hash('E2ePassword123!', 4), role: Role.ADMIN }));
    let jobId: number | undefined; let candidateId: number | undefined; let mergedSourceId: number | undefined; let pipelineId: number | undefined;
    try {
      const login = await request(app.getHttpServer()).post('/auth/login').send({ email: admin.email, password: 'E2ePassword123!' }).expect(200);
      const auth = { Authorization: `Bearer ${login.body.accessToken}` };
      const pipeline = await request(app.getHttpServer()).post('/pipelines').set(auth).send({ name: `Engineering ${suffix}`, stages: [{ name: 'Applied', category: 'applied', position: 1 }, { name: 'Technical review', category: 'screening', position: 2 }, { name: 'Rejected', category: 'rejected', position: 3 }] }).expect(201);
      pipelineId = pipeline.body.id; const [applied, screening] = pipeline.body.stages;
      await request(app.getHttpServer()).put(`/pipelines/${pipelineId}/stages/${applied.id}/transitions`).set(auth).send({ toStageIds: [screening.id] }).expect(200);
      const job = await request(app.getHttpServer()).post('/jobs').set(auth).send({ pipelineId, title: 'E2E Engineer', description: 'Pipeline verification' }).expect(201); jobId = job.body.id;
      await request(app.getHttpServer()).post(`/jobs/${jobId}/publish`).set(auth).expect(201);
      const candidate = await request(app.getHttpServer()).post('/candidates').set(auth).send({ firstName: 'E2E', lastName: 'Candidate', email: `candidate-${suffix}@example.com` }).expect(201); candidateId = candidate.body.id;
      await request(app.getHttpServer()).patch(`/candidates/${candidateId}`).set(auth).send({ tags: ['Priority', 'priority'], skills: ['TypeScript'], source: 'referral', privacyConsent: true }).expect(200);
      const search = await request(app.getHttpServer()).get('/candidates').query({ search: `candidate-${suffix}`, skill: 'typescript' }).set(auth).expect(200);
      expect(search.body.total).toBe(1);
      const application = await request(app.getHttpServer()).post('/applications').set(auth).send({ jobId, candidateId }).expect(201);
      const moved = await request(app.getHttpServer()).patch(`/applications/${application.body.id}/stage`).set(auth).send({ stageId: screening.id, comment: 'Qualified' }).expect(200);
      expect(moved.body.currentStage.id).toBe(screening.id);
      const source = await request(app.getHttpServer()).post('/candidates').set(auth).send({ firstName: 'Duplicate', lastName: 'Record', email: `duplicate-${suffix}@example.com`, skills: ['NestJS'] }).expect(201); mergedSourceId = source.body.id;
      await request(app.getHttpServer()).post(`/candidates/${candidateId}/merge`).set(auth).send({ sourceCandidateId: mergedSourceId }).expect(201);
      await request(app.getHttpServer()).get(`/candidates/${mergedSourceId}`).set(auth).expect(404);
      const exported = await request(app.getHttpServer()).get(`/candidates/${candidateId}/privacy/export`).set(auth).expect(200);
      expect(exported.body.applications).toHaveLength(1);
      await request(app.getHttpServer()).post(`/candidates/${candidateId}/archive`).set(auth).expect(201);
      await request(app.getHttpServer()).get(`/candidates/${candidateId}`).set(auth).expect(404);
      await request(app.getHttpServer()).post(`/candidates/${candidateId}/restore`).set(auth).expect(201);
    } finally {
      if (jobId) await dataSource.getRepository(Job).delete(jobId);
      if (mergedSourceId) await dataSource.getRepository(Candidate).delete(mergedSourceId);
      if (candidateId) await dataSource.getRepository(Candidate).delete(candidateId);
      if (pipelineId) await dataSource.getRepository(Pipeline).delete(pipelineId);
      await dataSource.getRepository(User).delete(admin.id);
    }
  });
});
