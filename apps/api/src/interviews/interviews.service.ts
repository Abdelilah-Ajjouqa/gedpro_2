import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {
  CALENDAR_PROVIDERS,
  CalendarProvider,
} from './calendar/calendar-provider';
import {
  CreateInterviewDto,
  CreateScorecardTemplateDto,
  InterviewOutcomeDto,
  RescheduleInterviewDto,
  SubmitScorecardDto,
} from './dto/interview.dto';
import { Interview } from './entities/interview.entity';
import { ScorecardTemplate } from './entities/scorecard-template.entity';
import { Scorecard } from './entities/scorecard.entity';
import { InterviewStatus } from './enums/interview-status.enum';
import { CommunicationsService } from '../communications/communications.service';
import { CommunicationType } from '../communications/entities/communication.entity';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviews: Repository<Interview>,
    @InjectRepository(ScorecardTemplate)
    private readonly templates: Repository<ScorecardTemplate>,
    @InjectRepository(Scorecard)
    private readonly scorecards: Repository<Scorecard>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(PipelineStage)
    private readonly stages: Repository<PipelineStage>,
    @Inject(CALENDAR_PROVIDERS) private readonly calendars: CalendarProvider[],
    private readonly timeline: TimelineService,
    private readonly communications: CommunicationsService,
  ) {}

  private record(
    interview: Interview,
    type: string,
    actor: User,
    metadata: Record<string, unknown> = {},
  ) {
    return this.timeline.record({
      type,
      actor,
      visibility: TimelineEventVisibility.INTERNAL,
      candidateId: interview.candidate.id,
      applicationId: interview.application?.id,
      targetType: interview.application
        ? TimelineTargetType.APPLICATION
        : TimelineTargetType.CANDIDATE,
      targetId: interview.application?.id ?? interview.candidate.id,
      sourceType: 'interview',
      sourceId: interview.id,
      metadata: {
        interviewId: interview.id,
        status: interview.status,
        ...metadata,
      },
    });
  }
  private async people(ids: number[]) {
    const unique = [...new Set(ids)];
    const found = unique.length
      ? await this.users.findBy({
          id: In(unique),
          isActive: true,
          role: In([Role.ADMIN, Role.RH, Role.MANAGER]),
        })
      : [];
    if (found.length !== unique.length)
      throw new BadRequestException(
        'One or more interviewers or attendees do not exist or are inactive',
      );
    return found;
  }
  private async conflicts(
    ids: number[],
    date: Date,
    duration: number,
    excludeId?: number,
  ) {
    if (!ids.length) return [];
    const end = new Date(date.getTime() + duration * 60000);
    const qb = this.interviews
      .createQueryBuilder('i')
      .leftJoin('i.attendees', 'person')
      .leftJoin('i.interviewer', 'owner')
      .where('i.status IN (:...statuses)', {
        statuses: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED],
      })
      .andWhere('(person.id IN (:...ids) OR owner.id IN (:...ids))', { ids })
      .andWhere(
        "i.date < :end AND (i.date + i.duration * interval '1 minute') > :start",
        { start: date, end },
      );
    if (excludeId) qb.andWhere('i.id != :excludeId', { excludeId });
    return qb.distinct(true).getMany();
  }
  private checkOverride(
    override: boolean | undefined,
    actor: User,
    conflicts: Interview[],
  ) {
    if (!conflicts.length) return;
    if (!override)
      throw new ConflictException({
        message: 'Interviewer scheduling conflict',
        conflictingInterviewIds: conflicts.map((i) => i.id),
      });
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException(
        'interviews:override-conflict permission required',
      );
  }
  private async sync(
    interview: Interview,
    action: 'createEvent' | 'updateEvent' | 'cancelEvent',
  ) {
    if (!interview.calendarProvider) return interview;
    const provider = this.calendars.find(
      (item) => item.name === interview.calendarProvider,
    );
    try {
      if (!provider)
        throw new Error(
          `Unknown calendar provider: ${interview.calendarProvider}`,
        );
      const eventId = (await provider[action](interview)) as string | undefined;
      if (eventId) interview.calendarEventId = eventId;
      interview.calendarSyncStatus = 'synced';
      interview.calendarSyncError = null;
    } catch (error) {
      interview.calendarSyncStatus = 'failed';
      interview.calendarSyncError =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Calendar operation failed';
    }
    return this.interviews.save(interview);
  }

  async create(dto: CreateInterviewDto, actor: User) {
    const [candidate, application] = await Promise.all([
      this.candidates.findOneBy({ id: dto.candidateId }),
      this.applications.findOne({
        where: { id: dto.applicationId },
        relations: { candidate: true, job: true },
      }),
    ]);
    if (!candidate)
      throw new NotFoundException(
        `Candidate with ID ${dto.candidateId} not found`,
      );
    if (!application)
      throw new NotFoundException(
        `Application with ID ${dto.applicationId} not found`,
      );
    if (application.candidate.id !== candidate.id)
      throw new BadRequestException('Application does not belong to candidate');
    if (actor.role === Role.MANAGER && application.job.owner.id !== actor.id)
      throw new ForbiddenException('Job is outside the manager scope');
    const reviewers = await this.people(
      dto.interviewerIds?.length ? dto.interviewerIds : [actor.id],
    );
    const attendees = await this.people(dto.attendeeIds ?? []);
    const date = new Date(dto.date);
    const duration = dto.duration ?? 60;
    if (date <= new Date())
      throw new BadRequestException('Interview date must be in the future');
    if (dto.feedbackDeadline && new Date(dto.feedbackDeadline) < date)
      throw new BadRequestException(
        'Feedback deadline cannot be before the interview',
      );
    const conflicts = await this.conflicts(
      [...reviewers, ...attendees].map((u) => u.id),
      date,
      duration,
    );
    this.checkOverride(dto.overrideConflicts, actor, conflicts);
    let template: ScorecardTemplate | null = null;
    if (dto.scorecardTemplateId) {
      template = await this.templates.findOneBy({
        id: dto.scorecardTemplateId,
        archived: false,
      });
      if (!template)
        throw new NotFoundException(
          `Scorecard template with ID ${dto.scorecardTemplateId} not found`,
        );
      if (template.job && template.job.id !== application.job.id)
        throw new BadRequestException(
          'Scorecard template is linked to a different job',
        );
    }
    let saved = await this.interviews.save(
      this.interviews.create({
        candidate,
        application,
        interviewer: reviewers[0],
        attendees: [
          ...new Map(
            [...reviewers.slice(1), ...attendees].map((u) => [u.id, u]),
          ).values(),
        ],
        date,
        duration,
        type: dto.type,
        round: dto.round ?? 1,
        title: dto.title ?? null,
        location: dto.location ?? null,
        notes: dto.notes ?? null,
        feedbackDeadline: dto.feedbackDeadline
          ? new Date(dto.feedbackDeadline)
          : null,
        hideFeedbackUntilComplete: dto.hideFeedbackUntilComplete ?? false,
        calendarProvider: dto.calendarProvider ?? null,
      }),
    );
    if (template)
      await this.scorecards.save(
        reviewers.map((reviewer) =>
          this.scorecards.create({ interview: saved, reviewer, template }),
        ),
      );
    await this.record(saved, 'interview.scheduled', actor, {
      date,
      duration,
      round: saved.round,
      reviewerIds: reviewers.map((u) => u.id),
    });
    if (conflicts.length)
      await this.record(saved, 'interview.conflict_overridden', actor, {
        conflictingInterviewIds: conflicts.map((i) => i.id),
      });
    saved = await this.sync(saved, 'createEvent');
    void this.communications
      .queue(
        {
          type: CommunicationType.INTERVIEW_INVITATION,
          interviewId: saved.id,
          idempotencyKey: `interview:${saved.id}:invitation:${saved.date.toISOString()}`,
        },
        actor,
      )
      .catch(() => undefined);
    return this.getOne(saved.id, actor);
  }
  findAll(actor: User) {
    return this.interviews.find({
      where:
        actor.role === Role.MANAGER
          ? { application: { job: { owner: { id: actor.id } } } }
          : {},
      order: { date: 'ASC' },
    });
  }
  private async load(id: number) {
    const result = await this.interviews.findOne({
      where: { id },
      relations: {
        candidate: true,
        application: true,
        interviewer: true,
        attendees: true,
        scorecards: { reviewer: true, template: true },
      },
    });
    if (!result)
      throw new NotFoundException(`Interview with ID ${id} not found`);
    return result;
  }
  async getOne(id: number, actor: User) {
    const interview = await this.load(id);
    if (
      actor.role === Role.MANAGER &&
      interview.application?.job.owner.id !== actor.id &&
      interview.interviewer.id !== actor.id &&
      !interview.attendees.some((attendee) => attendee.id === actor.id)
    )
      throw new ForbiddenException('Interview is outside the manager scope');
    const allSubmitted = interview.scorecards.every((row) => !!row.submittedAt);
    return {
      ...interview,
      scorecards: interview.scorecards.map((row) => {
        const visible =
          !!row.submittedAt &&
          (!interview.hideFeedbackUntilComplete ||
            allSubmitted ||
            row.reviewer.id === actor.id);
        return {
          ...row,
          ratings: visible ? row.ratings : null,
          recommendation: visible ? row.recommendation : null,
          privateNotes:
            row.reviewer.id === actor.id ? row.privateNotes : undefined,
        };
      }),
    };
  }
  async reschedule(id: number, dto: RescheduleInterviewDto, actor: User) {
    const interview = await this.load(id);
    if (
      actor.role === Role.MANAGER &&
      interview.application?.job.owner.id !== actor.id
    )
      throw new ForbiddenException('Job is outside the manager scope');
    if (
      ![InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED].includes(
        interview.status,
      )
    )
      throw new ConflictException('Only active interviews can be rescheduled');
    const date = new Date(dto.date);
    const duration = dto.duration ?? interview.duration;
    const conflicts = await this.conflicts(
      [interview.interviewer.id, ...interview.attendees.map((u) => u.id)],
      date,
      duration,
      id,
    );
    this.checkOverride(dto.overrideConflicts, actor, conflicts);
    const previousDate = interview.date;
    interview.date = date;
    interview.duration = duration;
    interview.status = InterviewStatus.RESCHEDULED;
    let saved = await this.interviews.save(interview);
    await this.record(saved, 'interview.rescheduled', actor, {
      previousDate,
      date,
      duration,
    });
    if (conflicts.length)
      await this.record(saved, 'interview.conflict_overridden', actor, {
        conflictingInterviewIds: conflicts.map((i) => i.id),
      });
    saved = await this.sync(saved, 'updateEvent');
    void this.communications
      .queue(
        {
          type: CommunicationType.INTERVIEW_INVITATION,
          interviewId: saved.id,
          idempotencyKey: `interview:${saved.id}:rescheduled:${saved.date.toISOString()}`,
        },
        actor,
      )
      .catch(() => undefined);
    return saved;
  }
  async outcome(id: number, dto: InterviewOutcomeDto, actor: User) {
    if (
      ![
        InterviewStatus.COMPLETED,
        InterviewStatus.CANCELLED,
        InterviewStatus.NO_SHOW,
      ].includes(dto.status)
    )
      throw new BadRequestException(
        'Outcome must be completed, cancelled, or no-show',
      );
    const interview = await this.load(id);
    if (
      ![InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED].includes(
        interview.status,
      )
    )
      throw new ConflictException('Interview already has a terminal outcome');
    interview.status = dto.status;
    let saved = await this.interviews.save(interview);
    await this.record(saved, `interview.${dto.status.toLowerCase()}`, actor, {
      reason: dto.reason,
    });
    if (dto.status === InterviewStatus.CANCELLED)
      saved = await this.sync(saved, 'cancelEvent');
    return saved;
  }
  cancel(id: number, actor: User) {
    return this.outcome(id, { status: InterviewStatus.CANCELLED }, actor);
  }

  async createTemplate(dto: CreateScorecardTemplateDto) {
    if (!dto.criteria.length)
      throw new BadRequestException('At least one criterion is required');
    const keys = new Set<string>();
    for (const c of dto.criteria) {
      if (keys.has(c.key))
        throw new BadRequestException(`Duplicate criterion key: ${c.key}`);
      keys.add(c.key);
      if (c.minRating >= c.maxRating)
        throw new BadRequestException(`Invalid rating range for ${c.key}`);
    }
    const [job, stage] = await Promise.all([
      dto.jobId ? this.jobs.findOneBy({ id: dto.jobId }) : null,
      dto.stageId
        ? this.stages.findOne({
            where: { id: dto.stageId },
            relations: { pipeline: true },
          })
        : null,
    ]);
    if (dto.jobId && !job)
      throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
    if (dto.stageId && !stage)
      throw new NotFoundException(
        `Pipeline stage with ID ${dto.stageId} not found`,
      );
    if (job && stage && job.pipeline.id !== stage.pipeline.id)
      throw new BadRequestException(
        'Stage does not belong to the job pipeline',
      );
    return this.templates.save(
      this.templates.create({
        name: dto.name,
        description: dto.description ?? null,
        criteria: dto.criteria.map((c) => ({
          ...c,
          required: c.required ?? true,
        })),
        job,
        stage,
      }),
    );
  }
  listTemplates(jobId?: number, stageId?: number) {
    return this.templates.find({
      where: {
        archived: false,
        ...(jobId ? { job: { id: jobId } } : {}),
        ...(stageId ? { stage: { id: stageId } } : {}),
      },
    });
  }
  async submitScorecard(id: number, dto: SubmitScorecardDto, actor: User) {
    const row = await this.scorecards.findOne({
      where: { id },
      relations: {
        interview: { candidate: true, application: true },
        reviewer: true,
        template: true,
      },
    });
    if (!row) throw new NotFoundException(`Scorecard with ID ${id} not found`);
    if (row.reviewer.id !== actor.id && actor.role !== Role.ADMIN)
      throw new ForbiddenException(
        'Only the assigned reviewer may submit this scorecard',
      );
    if (row.submittedAt)
      throw new ConflictException('Scorecard has already been submitted');
    const expected = new Map(row.template.criteria.map((c) => [c.key, c]));
    for (const c of row.template.criteria)
      if (c.required && dto.ratings[c.key] === undefined)
        throw new BadRequestException(`Missing rating: ${c.key}`);
    for (const [key, rating] of Object.entries(dto.ratings)) {
      const c = expected.get(key);
      if (!c) throw new BadRequestException(`Unknown rating: ${key}`);
      if (
        !Number.isInteger(rating) ||
        rating < c.minRating ||
        rating > c.maxRating
      )
        throw new BadRequestException(
          `Rating ${key} must be an integer from ${c.minRating} to ${c.maxRating}`,
        );
    }
    row.ratings = dto.ratings;
    row.recommendation = dto.recommendation;
    row.privateNotes = dto.privateNotes ?? null;
    row.submittedAt = new Date();
    const saved = await this.scorecards.save(row);
    await this.record(row.interview, 'scorecard.submitted', actor, {
      scorecardId: id,
      reviewerId: row.reviewer.id,
    });
    return saved;
  }
  async decisionSummary(applicationId: number, actor: User) {
    if (!(await this.applications.findOneBy({ id: applicationId })))
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`,
      );
    const rows = await this.scorecards.find({
      where: { interview: { application: { id: applicationId } } },
      relations: { interview: true, reviewer: true, template: true },
      order: { createdAt: 'ASC' },
    });
    const allSubmitted = rows.every((r) => !!r.submittedAt);
    return {
      applicationId,
      complete: rows.filter((r) => r.submittedAt).length,
      missing: rows
        .filter((r) => !r.submittedAt)
        .map((r) => ({
          scorecardId: r.id,
          interviewId: r.interview.id,
          reviewer: r.reviewer,
          deadline: r.interview.feedbackDeadline,
          overdue:
            !!r.interview.feedbackDeadline &&
            r.interview.feedbackDeadline < new Date(),
        })),
      scorecards: rows.map((r) => {
        const visible =
          !!r.submittedAt &&
          (!r.interview.hideFeedbackUntilComplete ||
            allSubmitted ||
            r.reviewer.id === actor.id);
        return {
          id: r.id,
          interviewId: r.interview.id,
          reviewer: r.reviewer,
          template: r.template,
          submittedAt: r.submittedAt,
          ratings: visible ? r.ratings : null,
          recommendation: visible ? r.recommendation : null,
          privateNotes:
            r.reviewer.id === actor.id || actor.role === Role.ADMIN
              ? r.privateNotes
              : undefined,
        };
      }),
    };
  }
}
