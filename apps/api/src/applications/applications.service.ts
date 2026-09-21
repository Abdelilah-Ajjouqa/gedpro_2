import {
  ConflictException,
  Injectable,
  HttpException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import {
  AuthorizationService,
  CAPABILITIES,
} from '../auth/authorization.service';
import { Candidate } from '../candidates/entities/candidate.entity';
import { CommunicationsService } from '../communications/communications.service';
import { CommunicationType } from '../communications/entities/communication.entity';
import { Job } from '../jobs/entities/job.entity';
import { JobStatus } from '../jobs/enums/job-status.enum';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { PipelineTransition } from '../pipelines/entities/pipeline-transition.entity';
import {
  StageCategory,
  TERMINAL_STAGE_CATEGORIES,
} from '../pipelines/enums/stage-category.enum';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {
  BulkMoveApplicationsDto,
  CreateApplicationDto,
  ListApplicationsDto,
  ReopenApplicationDto,
  TransitionApplicationDto,
} from './dto/application.dto';
import {
  ApplicationDetailDto,
  ApplicationStageDto,
  BulkMoveResultDto,
} from './dto/application-response.dto';
import { ApplicationHistory } from './entities/application-history.entity';
import { Application } from './entities/application.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    private readonly dataSource: DataSource,
    private readonly timeline: TimelineService,
    private readonly communications: CommunicationsService,
  ) {}
  private conflict(code: string, message: string, extra = {}) {
    return new ConflictException({ code, message, ...extra });
  }
  private notFound(id: number) {
    return new NotFoundException({
      code: 'APPLICATION_NOT_FOUND',
      message: `Application with ID ${id} not found`,
    });
  }
  private assertVersion(app: Application, expected: number) {
    if (app.version !== expected)
      throw new PreconditionFailedException({
        code: 'STALE_VERSION',
        message: 'The application changed after it was loaded',
        expectedVersion: expected,
        currentVersion: app.version,
      });
  }
  private stage(stage: PipelineStage): ApplicationStageDto;
  private stage(stage?: PipelineStage): ApplicationStageDto | undefined;
  private stage(stage?: PipelineStage): ApplicationStageDto | undefined {
    return stage
      ? {
          id: stage.id,
          name: stage.name,
          category: stage.category,
          position: stage.position,
          archived: stage.archived,
          terminal: TERMINAL_STAGE_CATEGORIES.includes(stage.category),
        }
      : undefined;
  }
  private person(user?: User) {
    return user
      ? { id: user.id, firstName: user.firstName, lastName: user.lastName }
      : undefined;
  }
  private canWrite(actor: User) {
    return (
      AuthorizationService.hasEvery(actor.role, [
        CAPABILITIES.APPLICATIONS_TRANSITION,
      ]) ||
      AuthorizationService.hasEvery(actor.role, [
        CAPABILITIES.APPLICATIONS_WRITE,
      ])
    );
  }
  private async project(
    app: Application,
    actor: User,
    includeHistory = false,
  ): Promise<ApplicationDetailDto> {
    const terminal = TERMINAL_STAGE_CATEGORIES.includes(
      app.currentStage.category,
    );
    const reopenEligible = [
      StageCategory.REJECTED,
      StageCategory.WITHDRAWN,
    ].includes(app.currentStage.category);
    const writable = this.canWrite(actor) && actor.role !== Role.MANAGER;
    const edges =
      writable && !terminal
        ? await this.dataSource.getRepository(PipelineTransition).find({
            where: { fromStage: { id: app.currentStage.id } },
            relations: { toStage: true },
          })
        : [];
    const allowedTransitions = edges
      .filter((edge) => !edge.toStage.archived)
      .map((edge) => ({
        stage: this.stage(edge.toStage),
        requiresRejectionReason:
          edge.toStage.category === StageCategory.REJECTED,
      }));
    const result: ApplicationDetailDto = {
      id: app.id,
      version: app.version,
      candidate: {
        id: app.candidate.id,
        firstName: app.candidate.firstName,
        lastName: app.candidate.lastName,
        email: app.candidate.erasedAt ? undefined : app.candidate.email,
      },
      job: { id: app.job.id, title: app.job.title },
      owner: this.person(app.owner),
      currentStage: this.stage(app.currentStage),
      source: app.source,
      terminal,
      reopenEligible,
      allowedActions: writable
        ? [
            ...(allowedTransitions.length ? ['transition'] : []),
            ...(reopenEligible ? ['reopen'] : []),
          ]
        : [],
      allowedTransitions,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      rejectionReason: undefined,
      history: [],
    };
    if (includeHistory) {
      result.rejectionReason = app.rejectionReason;
      result.history = [...(app.history ?? [])]
        .sort(
          (a, b) =>
            a.changedAt.getTime() - b.changedAt.getTime() || a.id - b.id,
        )
        .map((entry) => ({
          id: entry.id,
          kind:
            entry.kind ?? (entry.previousStage ? 'transitioned' : 'created'),
          previousStage: this.stage(entry.previousStage),
          newStage: this.stage(entry.newStage),
          comment: entry.comment,
          rejectionReason: entry.rejectionReason,
          actor: this.person(entry.changedBy),
          changedAt: entry.changedAt,
        }));
    }
    return result;
  }
  async create(dto: CreateApplicationDto, actor: User) {
    const candidate = await this.dataSource.getRepository(Candidate).findOne({
      where: { id: dto.candidateId },
      relations: { mergedInto: true },
    });
    const job = await this.dataSource.getRepository(Job).findOne({
      where: { id: dto.jobId },
      relations: { pipeline: { stages: true } },
    });
    if (!candidate)
      throw new NotFoundException({
        code: 'CANDIDATE_NOT_FOUND',
        message: 'Candidate not found',
      });
    if (!job)
      throw new NotFoundException({
        code: 'JOB_NOT_FOUND',
        message: 'Job not found',
      });
    if (
      candidate.archivedAt ||
      candidate.erasedAt ||
      candidate.deletionRequestedAt ||
      candidate.mergedInto
    )
      throw this.conflict(
        'CANDIDATE_INELIGIBLE',
        'This candidate cannot be added to an application',
      );
    if (job.status !== JobStatus.PUBLISHED)
      throw this.conflict(
        'JOB_NOT_PUBLISHED',
        'Applications require a published job',
      );
    const existing = await this.applications.findOneBy({
      candidate: { id: dto.candidateId },
      job: { id: dto.jobId },
    });
    if (existing)
      throw this.conflict(
        'DUPLICATE_APPLICATION',
        'Candidate already has an application for this job',
        { applicationId: existing.id },
      );
    const initial = job.pipeline.stages
      .filter((stage) => !stage.archived)
      .sort((a, b) => a.position - b.position)[0];
    if (!initial)
      throw this.conflict(
        'PIPELINE_NO_INITIAL_STAGE',
        'Job pipeline has no active initial stage',
      );
    const owner = dto.ownerId
      ? await this.dataSource
          .getRepository(User)
          .findOneBy({ id: dto.ownerId, isActive: true })
      : actor;
    if (!owner || ![Role.ADMIN, Role.RH, Role.MANAGER].includes(owner.role))
      throw this.conflict(
        'INVALID_APPLICATION_OWNER',
        'Owner must be an active recruiting user',
      );
    let created: Application;
    try {
      created = await this.dataSource.transaction(async (manager) => {
        const app = await manager.save(
          manager.create(Application, {
            candidate,
            job,
            owner,
            source: dto.source?.trim() || undefined,
            currentStage: initial,
          }),
        );
        await manager.save(
          manager.create(ApplicationHistory, {
            application: app,
            newStage: initial,
            changedBy: actor,
            kind: 'created',
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
          manager,
        );
        return app;
      });
    } catch (error) {
      const driverError =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string })
          : undefined;
      if (driverError?.code === '23505')
        throw this.conflict(
          'DUPLICATE_APPLICATION',
          'Candidate already has an application for this job',
        );
      throw error;
    }
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
    return this.findOne(created.id, actor);
  }
  async findAll(query: ListApplicationsDto, actor: User) {
    const builder = this.applications
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.owner', 'jobOwner')
      .leftJoinAndSelect('application.owner', 'owner')
      .leftJoinAndSelect('application.currentStage', 'stage');
    if (actor.role === Role.MANAGER)
      builder.andWhere('jobOwner.id = :actorId', { actorId: actor.id });
    if (query.jobId)
      builder.andWhere('job.id = :jobId', { jobId: query.jobId });
    if (query.candidateId)
      builder.andWhere('candidate.id = :candidateId', {
        candidateId: query.candidateId,
      });
    if (query.stageId)
      builder.andWhere('stage.id = :stageId', { stageId: query.stageId });
    if (query.ownerId)
      builder.andWhere('owner.id = :ownerId', { ownerId: query.ownerId });
    if (query.stageCategory)
      builder.andWhere('stage.category = :stageCategory', {
        stageCategory: query.stageCategory,
      });
    if (query.terminal !== 'all')
      builder.andWhere(
        `stage.category ${query.terminal === 'terminal' ? 'IN' : 'NOT IN'} (:...terminal)`,
        { terminal: TERMINAL_STAGE_CATEGORIES },
      );
    if (query.search?.trim())
      builder.andWhere(
        '(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR job.title ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    const sort =
      {
        createdAt: 'application.createdAt',
        updatedAt: 'application.updatedAt',
        candidate: 'candidate.lastName',
        job: 'job.title',
        stage: 'stage.position',
      }[query.sort] ?? 'application.createdAt';
    const direction = query.direction.toUpperCase() as 'ASC' | 'DESC';
    const [apps, total] = await builder
      .orderBy(sort, direction)
      .addOrderBy('application.id', direction)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      data: await Promise.all(apps.map((app) => this.project(app, actor))),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  private async findEntity(id: number, actor: User, history = false) {
    const builder = this.applications
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.owner', 'jobOwner')
      .leftJoinAndSelect('job.pipeline', 'pipeline')
      .leftJoinAndSelect('application.owner', 'owner')
      .leftJoinAndSelect('application.currentStage', 'stage')
      .where('application.id = :id', { id });
    if (history)
      builder
        .leftJoinAndSelect('application.history', 'history')
        .leftJoinAndSelect('history.previousStage', 'previousStage')
        .leftJoinAndSelect('history.newStage', 'newStage')
        .leftJoinAndSelect('history.changedBy', 'changedBy');
    if (actor.role === Role.MANAGER)
      builder.andWhere('jobOwner.id = :actorId', { actorId: actor.id });
    const app = await builder.getOne();
    if (!app) throw this.notFound(id);
    return app;
  }
  async findOne(id: number, actor: User) {
    return this.project(await this.findEntity(id, actor, true), actor, true);
  }
  async transition(
    id: number,
    dto: TransitionApplicationDto,
    actor: User,
    expectedVersion: number,
    reopen = false,
  ) {
    const moved = await this.dataSource.transaction(async (manager) => {
      const builder = manager
        .createQueryBuilder(Application, 'application')
        .innerJoinAndSelect('application.currentStage', 'currentStage')
        .innerJoinAndSelect('application.candidate', 'candidate')
        .innerJoinAndSelect('application.job', 'job')
        .innerJoinAndSelect('job.owner', 'jobOwner')
        .innerJoinAndSelect('job.pipeline', 'pipeline')
        .leftJoinAndSelect('application.owner', 'owner')
        .setLock('pessimistic_write')
        .where('application.id = :id', { id });
      if (actor.role === Role.MANAGER)
        builder.andWhere('jobOwner.id = :actorId', { actorId: actor.id });
      const app = await builder.getOne();
      if (!app) throw this.notFound(id);
      this.assertVersion(app, expectedVersion);
      const target = await manager
        .getRepository(PipelineStage)
        .findOne({ where: { id: dto.stageId }, relations: { pipeline: true } });
      if (
        !target ||
        target.pipeline.id !== app.job.pipeline.id ||
        target.archived ||
        target.id === app.currentStage.id
      )
        throw this.conflict(
          'INVALID_STAGE_TARGET',
          'Target stage must be a different active stage in the job pipeline',
        );
      const terminal = TERMINAL_STAGE_CATEGORIES.includes(
        app.currentStage.category,
      );
      if (terminal && !reopen)
        throw this.conflict(
          'TERMINAL_REOPEN_REQUIRED',
          'Terminal applications require the explicit reopen action',
        );
      if (
        reopen &&
        ![StageCategory.REJECTED, StageCategory.WITHDRAWN].includes(
          app.currentStage.category,
        )
      )
        throw this.conflict(
          'REOPEN_NOT_ALLOWED',
          'Only rejected or withdrawn applications can be reopened',
        );
      if (reopen && target.category !== StageCategory.APPLIED)
        throw this.conflict(
          'REOPEN_NOT_ALLOWED',
          'The configured reopen destination is invalid',
        );
      if (
        !reopen &&
        !(await manager.getRepository(PipelineTransition).findOneBy({
          fromStage: { id: app.currentStage.id },
          toStage: { id: target.id },
        }))
      )
        throw this.conflict(
          'TRANSITION_NOT_ALLOWED',
          'The configured pipeline does not allow this transition',
        );
      if (
        target.category === StageCategory.REJECTED &&
        !dto.rejectionReason?.trim()
      )
        throw this.conflict(
          'REJECTION_REASON_REQUIRED',
          'A rejection reason is required',
        );
      const previous = app.currentStage;
      app.currentStage = target;
      app.rejectionReason =
        target.category === StageCategory.REJECTED
          ? dto.rejectionReason!.trim()
          : undefined;
      await manager.save(app);
      await manager.save(
        manager.create(ApplicationHistory, {
          application: app,
          previousStage: previous,
          newStage: target,
          comment: dto.comment?.trim() || undefined,
          rejectionReason:
            target.category === StageCategory.REJECTED
              ? dto.rejectionReason!.trim()
              : undefined,
          changedBy: actor,
          kind: reopen ? 'reopened' : 'transitioned',
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
          },
        },
        manager,
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
    return this.findOne(moved.id, actor);
  }
  async reopen(
    id: number,
    dto: ReopenApplicationDto,
    actor: User,
    expectedVersion: number,
  ) {
    const app = await this.findEntity(id, actor);
    const applied = await this.dataSource.getRepository(PipelineStage).find({
      where: {
        pipeline: { id: app.job.pipeline.id },
        category: StageCategory.APPLIED,
        archived: false,
      },
      order: { position: 'ASC' },
    });
    if (applied.length !== 1)
      throw this.conflict(
        'REOPEN_NOT_ALLOWED',
        'The job pipeline must have exactly one active applied stage',
      );
    return this.transition(
      id,
      { stageId: applied[0].id, comment: dto.comment },
      actor,
      expectedVersion,
      true,
    );
  }
  async bulkMove(dto: BulkMoveApplicationsDto, actor: User) {
    if (
      new Set(dto.items.map((item) => item.applicationId)).size !==
      dto.items.length
    )
      throw this.conflict(
        'DUPLICATE_BULK_ITEM',
        'Bulk items must use unique application IDs',
      );
    const results: BulkMoveResultDto[] = [];
    for (const item of dto.items) {
      try {
        results.push({
          applicationId: item.applicationId,
          success: true,
          application: await this.transition(
            item.applicationId,
            {
              stageId: dto.stageId,
              comment: dto.comment,
              rejectionReason: dto.rejectionReason,
            },
            actor,
            item.version,
          ),
        });
      } catch (error: unknown) {
        const raw = error instanceof HttpException ? error.getResponse() : {};
        const response =
          typeof raw === 'object' && raw !== null
            ? (raw as {
                code?: string;
                message?: string | string[];
                currentVersion?: number;
              })
            : {};
        results.push({
          applicationId: item.applicationId,
          success: false,
          code: response.code ?? 'TRANSITION_FAILED',
          message: Array.isArray(response.message)
            ? response.message.join(' ')
            : (response.message ?? 'Transition failed'),
          currentVersion: response.currentVersion,
        });
      }
    }
    return { results };
  }
}
