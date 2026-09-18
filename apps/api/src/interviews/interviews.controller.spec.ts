import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

describe('InterviewsController', () => {
  let controller: InterviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [{ provide: InterviewsService, useValue: {} }],
    }).compile();

    controller = module.get<InterviewsController>(InterviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
