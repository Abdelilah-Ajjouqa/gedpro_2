import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Job } from '../jobs/entities/job.entity';
import { JobStatus } from '../jobs/enums/job-status.enum';
import { User } from '../users/entities/user.entity';
import { CreateApplicationDto, ListApplicationsDto, TransitionApplicationDto } from './dto/application.dto';
import { ApplicationHistory } from './entities/application-history.entity';
import { Application } from './entities/application.entity';
import { ApplicationStage } from './enums/application-stage.enum';

const TERMINAL = [ApplicationStage.HIRED, ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN];

@Injectable()
export class ApplicationsService {
  constructor(@InjectRepository(Application) private readonly applications: Repository<Application>, private readonly dataSource: DataSource) {}

  async create(dto: CreateApplicationDto, actor: User) {
    const candidate = await this.dataSource.getRepository(Candidate).findOneBy({ id: dto.candidateId });
    const job = await this.dataSource.getRepository(Job).findOneBy({ id: dto.jobId });
    if (!candidate) throw new NotFoundException(`Candidate with ID ${dto.candidateId} not found`);
    if (!job) throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
    if (job.status !== JobStatus.PUBLISHED) throw new BadRequestException('Applications can only be opened for published jobs');
    if (await this.applications.findOneBy({ candidate: { id: dto.candidateId }, job: { id: dto.jobId } })) throw new ConflictException('Candidate already has an application for this job');
    const owner = dto.ownerId ? await this.dataSource.getRepository(User).findOneBy({ id: dto.ownerId }) : actor;
    if (!owner) throw new NotFoundException(`Owner with ID ${dto.ownerId} not found`);
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.save(manager.create(Application, { candidate, job, owner, source: dto.source }));
      await manager.save(manager.create(ApplicationHistory, { application, newStage: ApplicationStage.APPLIED, changedBy: actor }));
      return application;
    });
  }

  async findAll(query: ListApplicationsDto) {
    const where: any = {};
    if (query.jobId) where.job = { id: query.jobId };
    if (query.candidateId) where.candidate = { id: query.candidateId };
    if (query.stage) where.currentStage = query.stage;
    const [data, total] = await this.applications.findAndCount({ where, order: { createdAt: 'DESC' }, skip: (query.page - 1) * query.limit, take: query.limit });
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const application = await this.applications.findOne({ where: { id }, relations: ['history'] });
    if (!application) throw new NotFoundException(`Application with ID ${id} not found`);
    return application;
  }

  async transition(id: number, dto: TransitionApplicationDto, actor: User) {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager
        .createQueryBuilder(Application, 'application')
        .setLock('pessimistic_write')
        .where('application.id = :id', { id })
        .getOne();
      if (!application) throw new NotFoundException(`Application with ID ${id} not found`);
      if (TERMINAL.includes(application.currentStage)) throw new BadRequestException('Terminal applications must be reopened before another transition');
      if (dto.stage === ApplicationStage.REJECTED && !dto.rejectionReason) throw new BadRequestException('A rejection reason is required');
      const previousStage = application.currentStage;
      application.currentStage = dto.stage;
      application.rejectionReason = dto.stage === ApplicationStage.REJECTED ? dto.rejectionReason : undefined;
      await manager.save(application);
      await manager.save(manager.create(ApplicationHistory, { application, previousStage, newStage: dto.stage, comment: dto.comment, changedBy: actor }));
      return application;
    });
  }
}
