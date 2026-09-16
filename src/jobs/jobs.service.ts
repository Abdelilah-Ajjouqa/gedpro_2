import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Pipeline } from '../pipelines/entities/pipeline.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateJobDto, owner: User) {
    const pipeline = await this.dataSource
      .getRepository(Pipeline)
      .findOneBy({ id: dto.pipelineId, archived: false });
    if (!pipeline)
      throw new NotFoundException(
        `Pipeline with ID ${dto.pipelineId} not found`,
      );
    const values: Omit<CreateJobDto, 'pipelineId'> = { ...dto };
    delete (values as Partial<CreateJobDto>).pipelineId;
    return this.jobs.save(this.jobs.create({ ...values, owner, pipeline }));
  }

  async findAll(query: ListJobsDto) {
    const builder = this.jobs
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.owner', 'owner');
    if (query.status)
      builder.andWhere('job.status = :status', { status: query.status });
    if (query.search)
      builder.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    const [data, total] = await builder
      .orderBy('job.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const job = await this.jobs.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    return job;
  }

  async update(id: number, dto: UpdateJobDto) {
    const job = await this.findOne(id);
    if (job.status === JobStatus.ARCHIVED)
      throw new BadRequestException('Archived jobs cannot be edited');
    const { pipelineId, ...values } = dto;
    if (pipelineId !== undefined && pipelineId !== job.pipeline.id) {
      if (
        await this.dataSource
          .getRepository(Application)
          .countBy({ job: { id } })
      )
        throw new BadRequestException(
          'A job pipeline cannot be changed after applications exist',
        );
      const pipeline = await this.dataSource
        .getRepository(Pipeline)
        .findOneBy({ id: pipelineId, archived: false });
      if (!pipeline)
        throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
      job.pipeline = pipeline;
    }
    return this.jobs.save(this.jobs.merge(job, values));
  }

  async changeStatus(id: number, status: JobStatus) {
    const job = await this.findOne(id);
    if (job.status === JobStatus.ARCHIVED)
      throw new BadRequestException('Archived jobs cannot change status');
    job.status = status;
    if (status === JobStatus.PUBLISHED) job.publishedAt = new Date();
    if (status === JobStatus.CLOSED) job.closedAt = new Date();
    return this.jobs.save(job);
  }
}
