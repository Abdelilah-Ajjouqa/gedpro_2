import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { getModelToken } from '@nestjs/mongoose';
import { Form } from './schemas/form.schema';
import { FormResponse } from './schemas/form-response.schema';
import { TimelineService } from '../timeline/timeline.service';

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: getModelToken(Form.name), useValue: {} },
        { provide: getModelToken(FormResponse.name), useValue: {} },
        { provide: TimelineService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
