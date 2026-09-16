import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmail } from 'class-validator';
import { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import {
  Document,
  DocumentStatus,
} from '../documents/entities/document.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateFormDto } from './dto/create-form.dto';
import {
  AssignFormDto,
  ListResponsesDto,
  ReviewResponseDto,
  SubmitResponseDto,
} from './dto/submit-response.dto';
import { Form, FormDocument, FormField } from './schemas/form.schema';
import {
  FormAssignment,
  FormAssignmentDocument,
  FormResponse,
  FormResponseDocument,
} from './schemas/form-response.schema';

@Injectable()
export class FormsService {
  constructor(
    @InjectModel(Form.name) private forms: Model<FormDocument>,
    @InjectModel(FormResponse.name)
    private responses: Model<FormResponseDocument>,
    @InjectModel(FormAssignment.name)
    private assignments: Model<FormAssignmentDocument>,
    @InjectRepository(Candidate) private candidates: Repository<Candidate>,
    @InjectRepository(Application)
    private applications: Repository<Application>,
    @InjectRepository(Job) private jobs: Repository<Job>,
    @InjectRepository(PipelineStage) private stages: Repository<PipelineStage>,
    @InjectRepository(Document) private documents: Repository<Document>,
    private timeline: TimelineService,
  ) {}

  fields(dto: CreateFormDto, previous: FormField[] = []): FormField[] {
    const oldById = new Map(previous.map((field) => [field.id, field]));
    const fields = dto.fields.map((field) => ({
      ...field,
      id: field.id ?? randomUUID(),
      required: field.required ?? false,
    }));
    const ids = new Set<string>();
    for (const field of fields) {
      if (ids.has(field.id))
        throw new BadRequestException({
          fields: { [field.id]: ['Field identifiers must be unique'] },
        });
      ids.add(field.id);
      if (
        field.type === 'select' &&
        (!field.options || field.options.length === 0)
      )
        throw new BadRequestException({
          fields: { [field.id]: ['Select fields require options'] },
        });
      if (field.type !== 'select' && field.options?.length)
        throw new BadRequestException({
          fields: { [field.id]: ['Only select fields accept options'] },
        });
      if (
        field.condition &&
        !fields.some((candidate) => candidate.id === field.condition!.fieldId)
      )
        throw new BadRequestException({
          fields: { [field.id]: ['Condition references an unknown field'] },
        });
      if (
        field.id &&
        oldById.has(field.id) &&
        oldById.get(field.id)!.type !== field.type
      )
        throw new BadRequestException({
          fields: {
            [field.id]: [
              'The type of an existing field identifier cannot change',
            ],
          },
        });
    }
    return fields as FormField[];
  }

  async createForm(dto: CreateFormDto, user: User) {
    const fields = this.fields(dto);
    return new this.forms({
      title: dto.title,
      description: dto.description,
      createdBy: user.id,
      currentVersion: 1,
      status: 'draft',
      versions: [
        {
          version: 1,
          title: dto.title,
          description: dto.description,
          fields,
          status: 'draft',
          createdAt: new Date(),
        },
      ],
    }).save();
  }
  async findAll(includeArchived = false) {
    return this.forms
      .find(includeArchived ? {} : { status: { $ne: 'archived' } })
      .sort({ updatedAt: -1 })
      .exec();
  }
  async findOne(id: string) {
    const form = await this.forms.findById(id).exec();
    if (!form) throw new NotFoundException(`Form with ID ${id} not found`);
    return form;
  }

  async update(id: string, dto: CreateFormDto) {
    const form = await this.findOne(id);
    if (form.status === 'archived')
      throw new ConflictException('Archived forms cannot be edited');
    const current = form.versions.find(
      (version) => version.version === form.currentVersion,
    )!;
    const fields = this.fields(dto, current.fields);
    if (current.status === 'published') {
      form.currentVersion += 1;
      form.versions.push({
        version: form.currentVersion,
        title: dto.title,
        description: dto.description,
        fields,
        status: 'draft',
        createdAt: new Date(),
      } as never);
    } else
      Object.assign(current, {
        title: dto.title,
        description: dto.description,
        fields,
      });
    form.title = dto.title;
    form.description = dto.description;
    return form.save();
  }
  async publish(id: string) {
    const form = await this.findOne(id);
    if (form.status === 'archived')
      throw new ConflictException('Archived forms cannot be published');
    const current = form.versions.find(
      (version) => version.version === form.currentVersion,
    )!;
    if (current.status === 'published') return form;
    current.status = 'published';
    current.publishedAt = new Date();
    form.status = 'published';
    return form.save();
  }
  async duplicate(id: string, user: User) {
    const source = await this.findOne(id);
    const current = source.versions.find(
      (v) => v.version === source.currentVersion,
    )!;
    return this.createForm(
      {
        title: `${current.title} (copy)`,
        description: current.description,
        fields: current.fields.map((f) => ({
          label: f.label,
          type: f.type as never,
          required: f.required,
          options: f.options,
          condition: f.condition as never,
        })),
      },
      user,
    );
  }
  async archive(id: string) {
    const form = await this.findOne(id);
    form.status = 'archived';
    form.archivedAt = new Date();
    return form.save();
  }
  async remove(id: string) {
    await this.findOne(id);
    if (await this.responses.exists({ formId: id }))
      throw new ConflictException(
        'Forms with responses must be archived, not deleted',
      );
    await this.assignments.deleteMany({ formId: id });
    await this.forms.findByIdAndDelete(id);
  }

  async assign(formId: string, dto: AssignFormDto, user: User) {
    const form = await this.findOne(formId);
    if (form.status !== 'published')
      throw new ConflictException('Only published forms can be assigned');
    if (!dto.jobId && !dto.applicationId && !dto.stageId)
      throw new BadRequestException(
        'At least one assignment target is required',
      );
    const [job, application, stage] = await Promise.all([
      dto.jobId ? this.jobs.findOneBy({ id: dto.jobId }) : undefined,
      dto.applicationId
        ? this.applications.findOneBy({ id: dto.applicationId })
        : undefined,
      dto.stageId
        ? this.stages.findOne({
            where: { id: dto.stageId },
            relations: { pipeline: true },
          })
        : undefined,
    ]);
    if (dto.jobId && !job) throw new NotFoundException('Job not found');
    if (dto.applicationId && !application)
      throw new NotFoundException('Application not found');
    if (dto.stageId && !stage)
      throw new NotFoundException('Pipeline stage not found');
    const effectiveJob = application?.job ?? job;
    if (job && application && application.job.id !== job.id)
      throw new BadRequestException('Application does not belong to the job');
    if (stage && effectiveJob && effectiveJob.pipeline.id !== stage.pipeline.id)
      throw new BadRequestException(
        'Stage does not belong to the target job pipeline',
      );
    try {
      return await new this.assignments({
        formId,
        ...dto,
        createdBy: user.id,
      }).save();
    } catch {
      throw new ConflictException('This form assignment already exists');
    }
  }
  async assignedForApplication(applicationId: number) {
    const application = await this.applications.findOneBy({
      id: applicationId,
    });
    if (!application) throw new NotFoundException('Application not found');
    const assignments = await this.assignments
      .find({
        $or: [
          { applicationId },
          { jobId: application.job.id },
          { stageId: application.currentStage.id },
        ],
      })
      .lean();
    const formIds = [
      ...new Set(assignments.map((assignment) => assignment.formId)),
    ];
    return this.forms
      .find({ _id: { $in: formIds }, status: 'published' })
      .exec();
  }

  private active(field: FormField, answers: Record<string, unknown>) {
    if (!field.condition) return true;
    const equal = answers[field.condition.fieldId] === field.condition.value;
    return field.condition.operator === 'equals' ? equal : !equal;
  }
  async validateAnswers(
    fields: FormField[],
    answers: Record<string, unknown>,
    candidateId?: number,
    applicationId?: number,
  ) {
    const errors: Record<string, string[]> = {};
    const known = new Set(fields.map((f) => f.id));
    Object.keys(answers)
      .filter((key) => !known.has(key))
      .forEach((key) => (errors[key] = ['Unknown field']));
    for (const field of fields) {
      if (!this.active(field, answers)) continue;
      const value = answers[field.id];
      if (
        field.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors[field.id] = ['This field is required'];
        continue;
      }
      if (value === undefined || value === null || value === '') continue;
      let valid = true;
      if (field.type === 'text') valid = typeof value === 'string';
      if (field.type === 'email')
        valid = typeof value === 'string' && isEmail(value);
      if (field.type === 'number')
        valid = typeof value === 'number' && Number.isFinite(value);
      if (field.type === 'boolean') valid = typeof value === 'boolean';
      if (field.type === 'date')
        valid = typeof value === 'string' && !Number.isNaN(Date.parse(value));
      if (field.type === 'select')
        valid = typeof value === 'string' && !!field.options?.includes(value);
      if (field.type === 'file') {
        const id = Number(value);
        const document = Number.isInteger(id)
          ? await this.documents.findOne({
              where: { id },
              relations: { candidate: true, application: true },
            })
          : null;
        valid =
          !!document &&
          document.status === DocumentStatus.ACTIVE &&
          (!candidateId ||
            document.candidate?.id === candidateId ||
            document.application?.candidate.id === candidateId) &&
          (!applicationId || document.application?.id === applicationId);
      }
      if (!valid) errors[field.id] = [`Invalid ${field.type} answer`];
    }
    if (Object.keys(errors).length)
      throw new BadRequestException({
        message: 'Form response validation failed',
        fields: errors,
      });
  }

  async submitResponse(formId: string, dto: SubmitResponseDto, user: User) {
    const form = await this.findOne(formId);
    const published = [...form.versions]
      .reverse()
      .find((v) => v.status === 'published');
    if (!published || form.status === 'archived')
      throw new ConflictException('Form is not available for submissions');
    let application: Application | null = null;
    const candidate = dto.candidateId
      ? await this.candidates.findOneBy({ id: dto.candidateId })
      : null;
    if (dto.candidateId && !candidate)
      throw new NotFoundException('Candidate not found');
    if (dto.applicationId) {
      application = await this.applications.findOneBy({
        id: dto.applicationId,
      });
      if (!application) throw new NotFoundException('Application not found');
      if (dto.candidateId && application.candidate.id !== dto.candidateId)
        throw new BadRequestException(
          'Application does not belong to the candidate',
        );
    }
    const responseCandidate = candidate ?? application?.candidate;
    if (
      user.role === Role.CANDIDATE &&
      (!responseCandidate ||
        responseCandidate.email.toLowerCase() !== user.email.toLowerCase())
    )
      throw new NotFoundException('Form assignment not found');
    if (application) {
      const assigned = await this.assignments.exists({
        formId,
        $or: [
          { applicationId: application.id },
          { jobId: application.job.id },
          { stageId: application.currentStage.id },
        ],
      });
      if (!assigned)
        throw new ConflictException(
          'Form is not assigned to this application or pipeline stage',
        );
    }
    await this.validateAnswers(
      published.fields,
      dto.answers,
      dto.candidateId ?? application?.candidate.id,
      dto.applicationId,
    );
    const saved = await new this.responses({
      formId,
      formVersion: published.version,
      formTitle: published.title,
      fieldsSnapshot: published.fields,
      answers: dto.answers,
      candidateId: dto.candidateId ?? application?.candidate.id,
      applicationId: dto.applicationId,
      jobId: application?.job.id,
      stageId: application?.currentStage.id,
      submittedBy: user.id,
    }).save();
    if (saved.candidateId)
      await this.timeline.record({
        type: 'form.response_submitted',
        actor: user,
        visibility: TimelineEventVisibility.CANDIDATE,
        candidateId: saved.candidateId,
        applicationId: saved.applicationId,
        targetType: saved.applicationId
          ? TimelineTargetType.APPLICATION
          : TimelineTargetType.CANDIDATE,
        targetId: saved.applicationId ?? saved.candidateId,
        sourceType: 'form_response',
        sourceId: saved._id.toString(),
        metadata: { formId, formVersion: published.version },
      });
    return saved;
  }
  async getResponses(formId: string, query: ListResponsesDto) {
    await this.findOne(formId);
    const filter = {
      formId,
      ...(query.candidateId && { candidateId: query.candidateId }),
      ...(query.applicationId && { applicationId: query.applicationId }),
      ...(query.reviewStatus && { reviewStatus: query.reviewStatus }),
    };
    const [data, total] = await Promise.all([
      this.responses
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      this.responses.countDocuments(filter),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }
  async review(responseId: string, dto: ReviewResponseDto, user: User) {
    const response = await this.responses.findByIdAndUpdate(
      responseId,
      {
        reviewStatus: dto.status,
        reviewNotes: dto.notes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      { new: true },
    );
    if (!response) throw new NotFoundException('Form response not found');
    return response;
  }
  async exportCsv(formId: string) {
    await this.findOne(formId);
    const rows = await this.responses
      .find({ formId })
      .sort({ createdAt: 1 })
      .lean();
    const ids = [
      ...new Set(rows.flatMap((r) => r.fieldsSnapshot.map((f) => f.id))),
    ];
    const escape = (value: unknown) => {
      const normalized =
        value === null || value === undefined
          ? ''
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value as string | number | boolean | bigint);
      return `"${normalized.replace(/"/g, '""')}"`;
    };
    return [
      ['responseId', 'formVersion', 'reviewStatus', ...ids]
        .map(escape)
        .join(','),
      ...rows.map((r) =>
        [
          r._id,
          r.formVersion,
          r.reviewStatus,
          ...ids.map((id) => r.answers[id]),
        ]
          .map(escape)
          .join(','),
      ),
    ].join('\n');
  }
}
