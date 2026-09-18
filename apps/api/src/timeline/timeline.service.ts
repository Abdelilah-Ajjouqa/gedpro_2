import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateTimelineNoteDto, TimelineQueryDto } from './dto/timeline.dto';
import {
  TimelineEvent,
  TimelineEventVisibility,
  TimelineTargetType,
} from './entities/timeline-event.entity';

export interface RecordTimelineEvent {
  type: string;
  actor?: User | null;
  visibility?: TimelineEventVisibility;
  candidateId: number;
  applicationId?: number | null;
  targetType: TimelineTargetType;
  targetId: number;
  sourceType?: string;
  sourceId?: string | number;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent)
    private readonly events: Repository<TimelineEvent>,
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
  ) {}

  async record(input: RecordTimelineEvent, manager?: EntityManager) {
    const repository = manager
      ? manager.getRepository(TimelineEvent)
      : this.events;
    return repository.save(
      repository.create({
        ...input,
        actorId: input.actor?.id ?? null,
        actorName: input.actor
          ? `${input.actor.firstName} ${input.actor.lastName}`.trim()
          : null,
        visibility: input.visibility ?? TimelineEventVisibility.INTERNAL,
        applicationId: input.applicationId ?? null,
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId === undefined ? null : String(input.sourceId),
        metadata: input.metadata ?? {},
        createdAt: input.createdAt,
      }),
    );
  }

  private decode(cursor?: string) {
    if (!cursor) return undefined;
    try {
      const [date, id] = Buffer.from(cursor, 'base64url')
        .toString('utf8')
        .split('|');
      if (!date || !id || Number.isNaN(Date.parse(date))) throw new Error();
      return { date, id };
    } catch {
      throw new BadRequestException('Invalid timeline cursor');
    }
  }

  private async authorize(candidate: Candidate, user: User) {
    if (user.role !== Role.CANDIDATE) return;
    if (candidate.normalizedEmail !== user.email.trim().toLowerCase())
      throw new ForbiddenException(
        'Candidates may only read their own timeline',
      );
  }

  private async page(
    candidateId: number,
    applicationId: number | undefined,
    query: TimelineQueryDto,
    user: User,
  ) {
    const candidate = await this.candidates.findOneBy({ id: candidateId });
    if (!candidate)
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    await this.authorize(candidate, user);
    const cursor = this.decode(query.cursor);
    const builder = this.events
      .createQueryBuilder('event')
      .where('event.candidateId = :candidateId', { candidateId });
    if (applicationId !== undefined)
      builder.andWhere('event.applicationId = :applicationId', {
        applicationId,
      });
    if (user.role === Role.CANDIDATE)
      builder.andWhere('event.visibility = :visibility', {
        visibility: TimelineEventVisibility.CANDIDATE,
      });
    if (cursor)
      builder.andWhere(
        '(event.createdAt < :date OR (event.createdAt = :date AND event.id < :id))',
        cursor,
      );
    const rows = await builder
      .orderBy('event.createdAt', 'DESC')
      .addOrderBy('event.id', 'DESC')
      .take(query.limit + 1)
      .getMany();
    const hasMore = rows.length > query.limit;
    const data = rows.slice(0, query.limit);
    const last = data[data.length - 1];
    return {
      data,
      nextCursor:
        hasMore && last
          ? Buffer.from(`${last.createdAt.toISOString()}|${last.id}`).toString(
              'base64url',
            )
          : null,
    };
  }

  async candidateTimeline(id: number, query: TimelineQueryDto, user: User) {
    return this.page(id, undefined, query, user);
  }
  async applicationTimeline(id: number, query: TimelineQueryDto, user: User) {
    const application = await this.applications.findOne({
      where: { id },
      relations: { candidate: true },
    });
    if (!application)
      throw new NotFoundException(`Application with ID ${id} not found`);
    return this.page(application.candidate.id, id, query, user);
  }
  async addCandidateNote(id: number, dto: CreateTimelineNoteDto, actor: User) {
    await this.candidates.findOneByOrFail({ id }).catch(() => {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    });
    return this.record({
      type: 'note.created',
      actor,
      visibility: dto.visibility,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      metadata: { text: dto.text, ...(dto.metadata ?? {}) },
    });
  }
  async addApplicationNote(
    id: number,
    dto: CreateTimelineNoteDto,
    actor: User,
  ) {
    const application = await this.applications.findOne({
      where: { id },
      relations: { candidate: true },
    });
    if (!application)
      throw new NotFoundException(`Application with ID ${id} not found`);
    return this.record({
      type: 'note.created',
      actor,
      visibility: dto.visibility,
      candidateId: application.candidate.id,
      applicationId: id,
      targetType: TimelineTargetType.APPLICATION,
      targetId: id,
      metadata: { text: dto.text, ...(dto.metadata ?? {}) },
    });
  }
}
