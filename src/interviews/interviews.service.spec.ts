import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsService } from './interviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { TimelineService } from '../timeline/timeline.service';

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: getRepositoryToken(Interview), useValue: {} },
        { provide: TimelineService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
