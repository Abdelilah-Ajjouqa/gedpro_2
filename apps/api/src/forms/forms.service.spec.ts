import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Document } from '../documents/entities/document.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { TimelineService } from '../timeline/timeline.service';
import { FormsService } from './forms.service';
import { Form } from './schemas/form.schema';
import { FormAssignment, FormResponse } from './schemas/form-response.schema';

describe('FormsService', () => {
  let service: FormsService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FormsService,
        ...[Form, FormResponse, FormAssignment].map((value) => ({
          provide: getModelToken(value.name),
          useValue: {},
        })),
        ...[Candidate, Application, Job, PipelineStage, Document].map(
          (value) => ({ provide: getRepositoryToken(value), useValue: {} }),
        ),
        { provide: TimelineService, useValue: { record: jest.fn() } },
      ],
    }).compile();
    service = module.get(FormsService);
  });
  it('generates stable unique field identifiers', () => {
    const fields = service.fields({
      title: 'Evaluation',
      fields: [
        { label: 'Rating', type: 'number' },
        { id: 'decision', label: 'Decision', type: 'select', options: ['yes'] },
      ],
    });
    expect(fields[0].id).toEqual(expect.any(String));
    expect(fields[1].id).toBe('decision');
  });
  it('rejects invalid selections with field-level errors', async () => {
    await expect(
      service.validateAnswers(
        [
          {
            id: 'decision',
            label: 'Decision',
            type: 'select',
            required: true,
            options: ['hire'],
          },
        ],
        { decision: 'reject' },
      ),
    ).rejects.toMatchObject({
      response: { fields: { decision: ['Invalid select answer'] } },
    });
  });
  it('requires conditional fields only while their condition is active', async () => {
    const fields = [
      { id: 'has', label: 'Has details', type: 'boolean' },
      {
        id: 'details',
        label: 'Details',
        type: 'text',
        required: true,
        condition: { fieldId: 'has', operator: 'equals', value: true },
      },
    ];
    await expect(
      service.validateAnswers(fields as never, { has: false }),
    ).resolves.toBeUndefined();
    await expect(
      service.validateAnswers(fields as never, { has: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
