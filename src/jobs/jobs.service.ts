import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';

@Injectable()
export class JobsService {
  constructor(@InjectRepository(Job) private readonly jobs: Repository<Job>) {}

  create(dto: CreateJobDto, owner: User) {
    return this.jobs.save(this.jobs.create({ ...dto, owner }));
  }

  async findAll(query: ListJobsDto) {
    const builder = this.jobs.createQueryBuilder('job').leftJoinAndSelect('job.owner', 'owner');
    if (query.status) builder.andWhere('job.status = :status', { status: query.status });
    if (query.search) builder.andWhere('(job.title ILIKE :search OR job.description ILIKE :search)', { search: `%${query.search}%` });
    const [data, total] = await builder.orderBy('job.createdAt', 'DESC').skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const job = await this.jobs.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    return job;
  }

  async update(id: number, dto: UpdateJobDto) {
    const job = await this.findOne(id);
    if (job.status === JobStatus.ARCHIVED) throw new BadRequestException('Archived jobs cannot be edited');
    return this.jobs.save(this.jobs.merge(job, dto));
  }

  async changeStatus(id: number, status: JobStatus) {
    const job = await this.findOne(id);
    if (job.status === JobStatus.ARCHIVED) throw new BadRequestException('Archived jobs cannot change status');
    job.status = status;
    if (status === JobStatus.PUBLISHED) job.publishedAt = new Date();
    if (status === JobStatus.CLOSED) job.closedAt = new Date();
    return this.jobs.save(job);
  }
}
