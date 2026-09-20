import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Job } from '../jobs/entities/job.entity';
import { JobStatus } from '../jobs/enums/job-status.enum';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { PipelineTransition } from '../pipelines/entities/pipeline-transition.entity';
import {
  StageCategory,
  TERMINAL_STAGE_CATEGORIES,
} from '../pipelines/enums/stage-category.enum';
import { User } from '../users/entities/user.entity';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import {
  BulkMoveApplicationsDto,
  CreateApplicationDto,
  ListApplicationsDto,
  TransitionApplicationDto,
} from './dto/application.dto';
import { ApplicationHistory } from './entities/application-history.entity';
import { Application } from './entities/application.entity';
import { CommunicationsService } from '../communications/communications.service';
import { CommunicationType } from '../communications/entities/communication.entity';
import { Role } from '../users/enums/role.enum';
@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applications: Repository<Application>,
    private dataSource: DataSource,
    private timeline: TimelineService,
    private communications: CommunicationsService,
  ) {}
  async create(dto: CreateApplicationDto, actor: User) {
    const candidate = await this.dataSource
      .getRepository(Candidate)
      .findOneBy({ id: dto.candidateId });
    const job = await this.dataSource.getRepository(Job).findOne({
      where: { id: dto.jobId },
      relations: { pipeline: { stages: true } },
    });
    if (!candidate)
      throw new NotFoundException(
        `Candidate with ID ${dto.candidateId} not found`,
      );
    if (!job) throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
    if (job.status !== JobStatus.PUBLISHED)
      throw new BadRequestException(
        'Applications can only be opened for published jobs',
      );
    if (
      await this.applications.findOneBy({
        candidate: { id: dto.candidateId },
        job: { id: dto.jobId },
      })
    )
      throw new ConflictException(
        'Candidate already has an application for this job',
      );
    const initial = job.pipeline.stages
      .filter((s) => !s.archived)
      .sort((a, b) => a.position - b.position)[0];
    if (!initial)
      throw new BadRequestException('Job pipeline has no active stages');
    const owner = dto.ownerId
      ? await this.dataSource.getRepository(User).findOneBy({ id: dto.ownerId })
      : actor;
    if (!owner)
      throw new NotFoundException(`Owner with ID ${dto.ownerId} not found`);
    const created = await this.dataSource.transaction(async (m) => {
      const app = await m.save(
        m.create(Application, {
          candidate,
          job,
          owner,
          source: dto.source,
          currentStage: initial,
        }),
      );
      await m.save(
        m.create(ApplicationHistory, {
          application: app,
          newStage: initial,
          changedBy: actor,
        }),
      );
      await this.timeline.record(
        {
          type: 'application.created',
          actor,
          visibility: TimelineEventVisibility.CANDIDATE,
          candidateId: candidate.id,
          applicationId: app.id,
          targetType: TimelineTargetType.APPLICATION,
          targetId: app.id,
          sourceType: 'application_history',
          metadata: {
            jobId: job.id,
            jobTitle: job.title,
            stageId: initial.id,
            stageName: initial.name,
          },
        },
        m,
      );
      return app;
    });
    void this.communications
      .queue(
        {
          type: CommunicationType.APPLICATION_ACKNOWLEDGEMENT,
          applicationId: created.id,
          idempotencyKey: `application:${created.id}:acknowledgement`,
        },
        actor,
      )
      .catch(() => undefined);
    return created;
  }
  async findAll(q: ListApplicationsDto, actor?: User) {
    const where: any = {};
    if (q.jobId) where.job = { id: q.jobId };
    if (q.candidateId) where.candidate = { id: q.candidateId };
    if (q.stageId) where.currentStage = { id: q.stageId };
    if (actor?.role === Role.MANAGER)
      where.job = { ...(where.job ?? {}), owner: { id: actor.id } };
    const [data, total] = await this.applications.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return { data, total, page: q.page, limit: q.limit };
  }
  async findOne(id: number, actor?: User) {
    const where =
      actor?.role === Role.MANAGER
        ? { id, job: { owner: { id: actor.id } } }
        : { id };
    const app = await this.applications.findOne({
      where,
      relations: { history: true },
    });
    if (!app)
      throw new NotFoundException(`Application with ID ${id} not found`);
    return app;
  }
  async transition(
    id: number,
    dto: TransitionApplicationDto,
    actor: User,
    reopen = false,
  ) {
    const moved = await this.dataSource.transaction(async (m) => {
      const app = await m
        .createQueryBuilder(Application, 'application')
        .innerJoinAndSelect('application.currentStage', 'currentStage')
        .innerJoinAndSelect('application.candidate', 'candidate')
        .innerJoinAndSelect('application.job', 'job')
        .innerJoinAndSelect('job.pipeline', 'pipeline')
        .setLock('pessimistic_write')
        .where('application.id=:id', { id })
        .getOne();
      if (!app)
        throw new NotFoundException(`Application with ID ${id} not found`);
      const target = await m
        .getRepository(PipelineStage)
        .findOne({ where: { id: dto.stageId }, relations: { pipeline: true } });
      if (
        !target ||
        target.pipeline.id !== app.job.pipeline.id ||
        target.archived
      )
        throw new BadRequestException(
          'Target stage must be active and belong to the job pipeline',
        );
      const terminal = TERMINAL_STAGE_CATEGORIES.includes(
        app.currentStage.category,
      );
      if (terminal && !reopen)
        throw new BadRequestException(
          'Terminal applications must be reopened before another transition',
        );
      if (
        reopen &&
        ![StageCategory.REJECTED, StageCategory.WITHDRAWN].includes(
          app.currentStage.category,
        )
      )
        throw new BadRequestException(
          'Only rejected or withdrawn applications can be reopened',
        );
      if (reopen && target.category !== StageCategory.APPLIED)
        throw new BadRequestException(
          'Reopened applications must return to an applied stage',
        );
      if (!reopen) {
        const allowed = await m.getRepository(PipelineTransition).findOneBy({
          fromStage: { id: app.currentStage.id },
          toStage: { id: target.id },
        });
        if (!allowed)
          throw new BadRequestException(
            `Transition from ${app.currentStage.name} to ${target.name} is not allowed`,
          );
      }
      if (target.category === StageCategory.REJECTED && !dto.rejectionReason)
        throw new BadRequestException('A rejection reason is required');
      const previous = app.currentStage;
      app.currentStage = target;
      app.rejectionReason =
        target.category === StageCategory.REJECTED
          ? dto.rejectionReason
          : undefined;
      await m.save(app);
      await m.save(
        m.create(ApplicationHistory, {
          application: app,
          previousStage: previous,
          newStage: target,
          comment: dto.comment,
          changedBy: actor,
        }),
      );
      await this.timeline.record(
        {
          type: reopen ? 'application.reopened' : 'application.stage_changed',
          actor,
          visibility: TimelineEventVisibility.CANDIDATE,
          candidateId: app.candidate.id,
          applicationId: app.id,
          targetType: TimelineTargetType.APPLICATION,
          targetId: app.id,
          sourceType: 'application_history',
          metadata: {
            previousStageId: previous.id,
            previousStageName: previous.name,
            newStageId: target.id,
            newStageName: target.name,
            comment: dto.comment,
            rejectionReason: dto.rejectionReason,
          },
        },
        m,
      );
      return app;
    });
    if (
      [StageCategory.REJECTED, StageCategory.OFFER].includes(
        moved.currentStage.category,
      )
    )
      void this.communications
        .queue(
          {
            type:
              moved.currentStage.category === StageCategory.REJECTED
                ? CommunicationType.REJECTION
                : CommunicationType.OFFER,
            applicationId: moved.id,
            idempotencyKey: `application:${moved.id}:stage:${moved.currentStage.id}:v${moved.version}`,
          },
          actor,
        )
        .catch(() => undefined);
    return moved;
  }
  reopen(id: number, dto: TransitionApplicationDto, actor: User) {
    return this.transition(id, dto, actor, true);
  }
  async bulkMove(dto: BulkMoveApplicationsDto, actor: User) {
    const results = [] as any[];
    for (const item of dto.items) {
      try {
        const application = await this.transition(
          item.applicationId,
          {
            stageId: item.stageId,
            comment: item.comment,
            rejectionReason: item.rejectionReason,
          },
          actor,
        );
        results.push({
          applicationId: item.applicationId,
          success: true,
          stageId: application.currentStage.id,
        });
      } catch (error) {
        results.push({
          applicationId: item.applicationId,
          success: false,
          error: error instanceof Error ? error.message : 'Transition failed',
        });
      }
    }
    return { results };
  }
}
