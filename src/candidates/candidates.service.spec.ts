import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateHistory } from './entities/candidate-history.entity';
import { getModelToken } from '@nestjs/mongoose';
import { FormResponse } from '../forms/schemas/form-response.schema';
import { SecurityAuditService } from '../auth/security-audit.service';
import { TimelineService } from '../timeline/timeline.service';

describe('CandidatesService', () => {
  let service: CandidatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: getRepositoryToken(Candidate), useValue: {} },
        { provide: getRepositoryToken(CandidateHistory), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: getModelToken(FormResponse.name), useValue: {} },
        { provide: SecurityAuditService, useValue: { record: jest.fn() } },
        { provide: TimelineService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
