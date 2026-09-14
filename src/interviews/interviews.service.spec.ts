import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsService } from './interviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: getRepositoryToken(Interview), useValue: {} },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
