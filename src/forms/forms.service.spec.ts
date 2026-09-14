import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { getModelToken } from '@nestjs/mongoose';
import { Form } from './schemas/form.schema';
import { FormResponse } from './schemas/form-response.schema';

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: getModelToken(Form.name), useValue: {} },
        { provide: getModelToken(FormResponse.name), useValue: {} },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
