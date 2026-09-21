import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Pipeline } from '../pipelines/entities/pipeline.entity';
import { PipelinesService } from '../pipelines/pipelines.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    private readonly dataSource: DataSource,
    private readonly pipelinePolicy?: PipelinesService,
  ) {}

  private conflict(code: string, message: string, extra = {}) {
    return new ConflictException({ code, message, ...extra });
  }

  private assertVersion(job: Job, expectedVersion?: number) {
    if (expectedVersion !== undefined && job.version !== expectedVersion)
      throw new PreconditionFailedException({
        code: 'STALE_VERSION',
        message: 'The job changed after it was loaded',
        expectedVersion,
        currentVersion: job.version,
      });
  }

  private decorate(job: Job) {
    const allowedActions: string[] = [];
    if (job.status === JobStatus.DRAFT)
      allowedActions.push('update', 'publish');
    if (job.status === JobStatus.PUBLISHED)
      allowedActions.push('update', 'close');
    if (job.status === JobStatus.CLOSED)
      allowedActions.push('update', 'reopen');
    if (job.status === JobStatus.DRAFT || job.status === JobStatus.CLOSED)
      allowedActions.push('archive');
    return { ...job, allowedActions };
  }

  async create(dto: CreateJobDto, owner: User) {
    const pipeline = await this.dataSource
      .getRepository(Pipeline)
      .findOneBy({ id: dto.pipelineId, archived: false });
    if (!pipeline)
      throw new NotFoundException({
        code: 'PIPELINE_NOT_FOUND',
        message: `Pipeline with ID ${dto.pipelineId} not found`,
      });
    const values = {
      title: dto.title,
      description: dto.description,
      department: dto.department,
      location: dto.location,
      employmentType: dto.employmentType,
    };
    return this.decorate(
      await this.jobs.save(this.jobs.create({ ...values, owner, pipeline })),
    );
  }

  async findAll(query: ListJobsDto, actor?: User) {
    const builder = this.jobs
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.owner', 'owner')
      .leftJoinAndSelect('job.pipeline', 'pipeline')
      .where('job.status != :archived', { archived: JobStatus.ARCHIVED });
    if (actor?.role === Role.MANAGER)
      builder.andWhere('owner.id = :ownerId', { ownerId: actor.id });
    else if (query.ownerId)
      builder.andWhere('owner.id = :ownerId', { ownerId: query.ownerId });
    if (query.status)
      builder.andWhere('job.status = :status', { status: query.status });
    if (query.search?.trim())
      builder.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    const columns = {
      createdAt: 'job.createdAt',
      updatedAt: 'job.updatedAt',
      title: 'job.title',
      status: 'job.status',
    } as const;
    const direction = query.direction.toUpperCase() as 'ASC' | 'DESC';
    const [data, total] = await builder
      .orderBy(columns[query.sort], direction)
      .addOrderBy('job.id', direction)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      data: data.map((job) => this.decorate(job)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOneEntity(id: number, actor?: User) {
    const where =
      actor?.role === Role.MANAGER ? { id, owner: { id: actor.id } } : { id };
    const job = await this.jobs.findOne({ where });
    if (!job)
      throw new NotFoundException({
        code: 'JOB_NOT_FOUND',
        message: `Job with ID ${id} not found`,
      });
    return job;
  }

  async findOne(id: number, actor?: User) {
    return this.decorate(await this.findOneEntity(id, actor));
  }

  async update(id: number, dto: UpdateJobDto, expectedVersion?: number) {
    const job = await this.findOneEntity(id);
    this.assertVersion(job, expectedVersion);
    if (job.status === JobStatus.ARCHIVED)
      throw this.conflict('JOB_ARCHIVED', 'Archived jobs cannot be edited');
    const { pipelineId, ...values } = dto;
    if (pipelineId !== undefined && pipelineId !== job.pipeline.id) {
      if (
        await this.dataSource
          .getRepository(Application)
          .countBy({ job: { id } })
      )
        throw this.conflict(
          'JOB_PIPELINE_LOCKED',
          'A job pipeline cannot be changed after applications exist',
        );
      const pipeline = await this.dataSource
        .getRepository(Pipeline)
        .findOneBy({ id: pipelineId, archived: false });
      if (!pipeline)
        throw new NotFoundException({
          code: 'PIPELINE_NOT_FOUND',
          message: `Pipeline with ID ${pipelineId} not found`,
        });
      job.pipeline = pipeline;
    }
    return this.decorate(await this.jobs.save(this.jobs.merge(job, values)));
  }

  async publish(id: number, expectedVersion?: number) {
    const job = await this.findOneEntity(id);
    this.assertVersion(job, expectedVersion);
    if (job.status === JobStatus.PUBLISHED) return this.decorate(job);
    if (job.status !== JobStatus.DRAFT)
      throw this.conflict(
        'ILLEGAL_JOB_LIFECYCLE',
        'Only draft jobs can be published',
      );
    if (this.pipelinePolicy) {
      const readiness = await this.pipelinePolicy.getReadiness(job.pipeline.id);
      if (!readiness.ready)
        throw this.conflict(
          'PIPELINE_NOT_READY',
          'The pipeline is not ready to publish',
          { issues: readiness.issues },
        );
    }
    job.status = JobStatus.PUBLISHED;
    job.publishedAt ??= new Date();
    return this.decorate(await this.jobs.save(job));
  }

  async close(id: number, expectedVersion?: number) {
    const job = await this.findOneEntity(id);
    this.assertVersion(job, expectedVersion);
    if (job.status === JobStatus.CLOSED) return this.decorate(job);
    if (job.status !== JobStatus.PUBLISHED)
      throw this.conflict(
        'ILLEGAL_JOB_LIFECYCLE',
        'Only published jobs can be closed',
      );
    job.status = JobStatus.CLOSED;
    job.closedAt = new Date();
    return this.decorate(await this.jobs.save(job));
  }

  async reopen(id: number, expectedVersion?: number) {
    const job = await this.findOneEntity(id);
    this.assertVersion(job, expectedVersion);
    if (job.status === JobStatus.PUBLISHED) return this.decorate(job);
    if (job.status !== JobStatus.CLOSED)
      throw this.conflict(
        'ILLEGAL_JOB_LIFECYCLE',
        'Only closed jobs can be reopened',
      );
    job.status = JobStatus.PUBLISHED;
    job.closedAt = undefined;
    job.reopenedAt = new Date();
    return this.decorate(await this.jobs.save(job));
  }

  async archive(id: number, expectedVersion?: number) {
    const job = await this.findOneEntity(id);
    this.assertVersion(job, expectedVersion);
    if (job.status === JobStatus.ARCHIVED) return this.decorate(job);
    if (job.status === JobStatus.PUBLISHED)
      throw this.conflict(
        'JOB_MUST_BE_CLOSED',
        'Published jobs must be closed before archive',
      );
    const applications = await this.dataSource
      .getRepository(Application)
      .find({ where: { job: { id } }, relations: { currentStage: true } });
    const terminal = new Set(['hired', 'rejected', 'withdrawn']);
    if (
      (job.status === JobStatus.DRAFT && applications.length > 0) ||
      (job.status === JobStatus.CLOSED &&
        applications.some((item) => !terminal.has(item.currentStage.category)))
    )
      throw this.conflict(
        'JOB_ARCHIVE_IN_USE',
        'The job has non-terminal applications and cannot be archived',
      );
    job.status = JobStatus.ARCHIVED;
    return this.decorate(await this.jobs.save(job));
  }

  /** @deprecated use explicit lifecycle methods */
  changeStatus(id: number, status: JobStatus) {
    if (status === JobStatus.PUBLISHED) return this.publish(id);
    if (status === JobStatus.CLOSED) return this.close(id);
    if (status === JobStatus.ARCHIVED) return this.archive(id);
    throw new BadRequestException('Unsupported status transition');
  }
}
