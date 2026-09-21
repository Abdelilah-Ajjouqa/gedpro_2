import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { SecurityAuditService } from '../auth/security-audit.service';
import { FormResponse } from '../forms/schemas/form-response.schema';
import { Interview } from '../interviews/entities/interview.entity';
import { User } from '../users/entities/user.entity';
import {
  normalizeEmail,
  normalizeLabels,
  normalizePhone,
} from './candidate-normalization';
import {
  CreateCandidateDto,
  ListCandidatesDto,
  UpdateCandidateDto,
} from './dto/create-candidate.dto';
import { CandidateHistory } from './entities/candidate-history.entity';
import { Candidate } from './entities/candidate.entity';
import { CandidateState } from './enums/candidate-state.enum';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import { Role } from '../users/enums/role.enum';
import {
  AuthorizationService,
  CAPABILITIES,
} from '../auth/authorization.service';
@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate) private candidates: Repository<Candidate>,
    @InjectRepository(CandidateHistory)
    private histories: Repository<CandidateHistory>,
    private dataSource: DataSource,
    @InjectModel(FormResponse.name) private responses: Model<FormResponse>,
    private audit: SecurityAuditService,
    private timeline: TimelineService,
  ) {}
  private async owner(id?: number | null) {
    if (!id) return undefined;
    const value = await this.dataSource.getRepository(User).findOneBy({ id });
    if (!value) throw new NotFoundException(`Owner with ID ${id} not found`);
    return value;
  }
  private values(dto: CreateCandidateDto | UpdateCandidateDto) {
    const value: any = { ...dto };
    delete value.ownerId;
    if (dto.email) {
      value.email = normalizeEmail(dto.email);
      value.normalizedEmail = value.email;
    }
    if (dto.phone !== undefined)
      value.normalizedPhone = normalizePhone(dto.phone);
    if (dto.tags) value.tags = normalizeLabels(dto.tags);
    if (dto.skills) value.skills = normalizeLabels(dto.skills);
    if (dto.retentionUntil) value.retentionUntil = new Date(dto.retentionUntil);
    if (dto.privacyConsent !== undefined)
      value.consentAt = dto.privacyConsent ? new Date() : null;
    return value;
  }
  private assertVersion(candidate: Candidate, expected: number) {
    if (candidate.version !== expected)
      throw new HttpException(
        {
          code: 'STALE_CANDIDATE',
          message: 'Candidate changed since it was loaded',
          expectedVersion: expected,
          currentVersion: candidate.version,
        },
        412,
      );
  }
  private disposition(candidate: Candidate) {
    if (candidate.erasedAt) return 'erased';
    if (candidate.mergedInto) return 'merged';
    if (candidate.archivedAt) return 'archived';
    return 'active';
  }
  private ownerDto(owner?: User) {
    return owner
      ? { id: owner.id, firstName: owner.firstName, lastName: owner.lastName }
      : null;
  }
  private listDto(candidate: Candidate) {
    return {
      id: candidate.id,
      firstName: candidate.erasedAt ? 'Erased' : candidate.firstName,
      lastName: candidate.erasedAt ? 'candidate' : candidate.lastName,
      email: candidate.erasedAt ? '' : candidate.email,
      phone: candidate.erasedAt ? null : (candidate.phone ?? null),
      tags: candidate.tags ?? [],
      skills: candidate.skills ?? [],
      source: candidate.source ?? null,
      owner: this.ownerDto(candidate.owner),
      state: candidate.currentState,
      disposition: this.disposition(candidate),
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      version: candidate.version,
    };
  }
  private async detailDto(candidate: Candidate, actor?: User) {
    const privacyAllowed = actor
      ? AuthorizationService.hasEvery(actor.role, [
          CAPABILITIES.CANDIDATES_PRIVACY_REQUEST_DELETION,
        ])
      : false;
    const applicationCount = await this.dataSource
      .getRepository(Application)
      .count({ where: { candidate: { id: candidate.id } } });
    const disposition = this.disposition(candidate);
    const allowedActions =
      actor && disposition === 'active'
        ? AuthorizationService.capabilitiesFor(actor.role).filter((value) =>
            value.startsWith('candidates:'),
          )
        : actor && disposition === 'archived'
          ? [CAPABILITIES.CANDIDATES_RESTORE].filter((value) =>
              AuthorizationService.hasEvery(actor.role, [value]),
            )
          : [];
    return {
      ...this.listDto(candidate),
      stateHistory: (candidate.history ?? []).map((item) => ({
        id: item.id,
        previousState: item.previousState,
        newState: item.newState,
        comment: item.comment ?? null,
        changedAt: item.changedAt,
        changedBy: this.ownerDto(item.changedBy),
      })),
      mergedInto: candidate.mergedInto
        ? {
            id: candidate.mergedInto.id,
            displayName: `${candidate.mergedInto.firstName} ${candidate.mergedInto.lastName}`,
          }
        : null,
      privacy: privacyAllowed
        ? {
            consent: candidate.privacyConsent,
            consentAt: candidate.consentAt ?? null,
            retentionUntil: candidate.retentionUntil ?? null,
            deletionRequestedAt: candidate.deletionRequestedAt ?? null,
            erasedAt: candidate.erasedAt ?? null,
            erasureBlocked: Boolean(
              candidate.retentionUntil && candidate.retentionUntil > new Date(),
            ),
            allowedActions,
          }
        : null,
      applicationCount,
      allowedActions,
    };
  }
  async create(dto: CreateCandidateDto, actor?: User) {
    const normalizedEmail = normalizeEmail(dto.email);
    const normalizedPhone = normalizePhone(dto.phone);
    if (await this.candidates.findOneBy({ normalizedEmail }))
      throw new ConflictException('A candidate with this email already exists');
    if (
      normalizedPhone &&
      (await this.candidates.findOneBy({ normalizedPhone }))
    )
      throw new ConflictException('A candidate with this phone already exists');
    const entity = this.candidates.create(this.values(dto) as Candidate);
    entity.owner = await this.owner(dto.ownerId);
    const candidate = await this.candidates.save(entity);
    await this.audit.record('candidate.created', actor?.id ?? null, undefined, {
      candidateId: candidate.id,
    });
    await this.timeline.record({
      type: 'candidate.created',
      actor,
      visibility: TimelineEventVisibility.CANDIDATE,
      candidateId: candidate.id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: candidate.id,
      sourceType: 'candidate',
      sourceId: candidate.id,
    });
    return this.detailDto(candidate, actor);
  }
  async findAll(q: ListCandidatesDto, actor?: User) {
    const b = this.candidates
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.owner', 'owner');
    if (actor?.role === Role.MANAGER)
      b.innerJoin(
        Application,
        'authorizedApplication',
        'authorizedApplication.candidateId = candidate.id',
      )
        .innerJoin(
          'authorizedApplication.job',
          'authorizedJob',
          'authorizedJob.ownerId = :managerId',
          { managerId: actor.id },
        )
        .distinct(true);
    b.andWhere('candidate.mergedIntoId IS NULL');
    if (q.disposition === 'active')
      b.andWhere('candidate.archivedAt IS NULL').andWhere(
        'candidate.erasedAt IS NULL',
      );
    if (q.disposition === 'archived')
      b.andWhere('candidate.archivedAt IS NOT NULL').andWhere(
        'candidate.erasedAt IS NULL',
      );
    if (q.state)
      b.andWhere('candidate.currentState=:state', { state: q.state });
    if (q.search)
      b.andWhere(
        '(candidate.firstName ILIKE :s OR candidate.lastName ILIKE :s OR candidate.email ILIKE :s OR candidate.phone ILIKE :s)',
        { s: `%${q.search.replace(/[\\%_]/g, '\\$&')}%` },
      );
    if (q.tag)
      b.andWhere(':tag=ANY(candidate.tags)', { tag: q.tag.toLowerCase() });
    if (q.skill)
      b.andWhere(':skill=ANY(candidate.skills)', {
        skill: q.skill.toLowerCase(),
      });
    if (q.source) b.andWhere('candidate.source=:source', { source: q.source });
    if (q.ownerId) b.andWhere('owner.id=:ownerId', { ownerId: q.ownerId });
    const [data, total] = await b
      .orderBy(`candidate.${q.sortBy}`, q.sortOrder)
      .addOrderBy('candidate.id', q.sortOrder)
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getManyAndCount();
    return {
      data: data.map((candidate) => this.listDto(candidate)),
      total,
      page: q.page,
      limit: q.limit,
      totalPages: Math.ceil(total / q.limit),
    };
  }
  private async findEntity(id: number, includeDisposed = false, actor?: User) {
    if (
      actor?.role === Role.MANAGER &&
      !(await this.dataSource.getRepository(Application).count({
        where: { candidate: { id }, job: { owner: { id: actor.id } } },
      }))
    )
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    const candidate = await this.candidates.findOne({
      where: {
        id,
        ...(!includeDisposed
          ? { archivedAt: IsNull(), mergedInto: IsNull() }
          : {}),
      },
      relations: { history: { changedBy: true }, mergedInto: true },
    });
    if (!candidate)
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    return candidate;
  }
  async findOne(id: number, includeDisposed = false, actor?: User) {
    return this.detailDto(
      await this.findEntity(id, includeDisposed, actor),
      actor,
    );
  }
  async update(
    id: number,
    dto: UpdateCandidateDto,
    actor: User,
    version: number,
  ) {
    const candidate = await this.findEntity(id);
    this.assertVersion(candidate, version);
    const normalizedEmail = dto.email ? normalizeEmail(dto.email) : undefined;
    const normalizedPhone =
      dto.phone !== undefined ? normalizePhone(dto.phone) : undefined;
    if (
      normalizedEmail &&
      (await this.candidates.findOneBy({ normalizedEmail }))
    ) {
      const other = await this.candidates.findOneBy({ normalizedEmail });
      if (other?.id !== id)
        throw new ConflictException(
          'A candidate with this email already exists',
        );
    }
    if (normalizedPhone) {
      const other = await this.candidates.findOneBy({ normalizedPhone });
      if (other && other.id !== id)
        throw new ConflictException(
          'A candidate with this phone already exists',
        );
    }
    Object.assign(candidate, this.values(dto));
    if (dto.ownerId !== undefined)
      candidate.owner = await this.owner(dto.ownerId);
    const saved = await this.candidates.save(candidate);
    await this.audit.record('candidate.updated', actor.id, undefined, {
      candidateId: id,
      fields: Object.keys(dto),
    });
    await this.timeline.record({
      type: 'candidate.profile_updated',
      actor,
      visibility: TimelineEventVisibility.CANDIDATE,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      sourceType: 'candidate',
      sourceId: id,
      metadata: { fields: Object.keys(dto) },
    });
    return this.detailDto(saved, actor);
  }
  async archive(id: number, actor: User, version: number) {
    const c = await this.findEntity(id, true);
    this.assertVersion(c, version);
    if (c.mergedInto || c.erasedAt)
      throw new ConflictException('Candidate cannot be archived');
    if (c.archivedAt) return this.detailDto(c, actor);
    c.archivedAt = new Date();
    const saved = await this.candidates.save(c);
    await this.audit.record('candidate.archived', actor.id, undefined, {
      candidateId: id,
    });
    await this.timeline.record({
      type: 'candidate.archived',
      actor,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      sourceType: 'candidate',
      sourceId: id,
    });
    return this.detailDto(saved, actor);
  }
  async restore(id: number, actor: User, version: number) {
    const c = await this.findEntity(id, true);
    this.assertVersion(c, version);
    if (c.mergedInto)
      throw new BadRequestException('Merged candidates cannot be restored');
    if (c.erasedAt)
      throw new BadRequestException('Erased candidates cannot be restored');
    if (!c.archivedAt) return this.detailDto(c, actor);
    c.archivedAt = undefined;
    const saved = await this.candidates.save(c);
    await this.audit.record('candidate.restored', actor.id, undefined, {
      candidateId: id,
    });
    await this.timeline.record({
      type: 'candidate.restored',
      actor,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      sourceType: 'candidate',
      sourceId: id,
    });
    return this.detailDto(saved, actor);
  }
  async duplicates(id: number) {
    const c = await this.findEntity(id, true);
    const values = await this.candidates
      .createQueryBuilder('candidate')
      .where('candidate.id!=:id', { id })
      .andWhere('candidate.mergedIntoId IS NULL')
      .andWhere(
        '(candidate.normalizedEmail=:email OR (:phone IS NOT NULL AND candidate.normalizedPhone=:phone))',
        { email: c.normalizedEmail, phone: c.normalizedPhone ?? null },
      )
      .getMany();
    return values.map((candidate) => ({
      ...this.listDto(candidate),
      matchReasons: [
        ...(candidate.normalizedEmail === c.normalizedEmail ? ['email'] : []),
        ...(candidate.normalizedPhone &&
        candidate.normalizedPhone === c.normalizedPhone
          ? ['phone']
          : []),
      ],
    }));
  }
  async merge(
    targetId: number,
    sourceId: number,
    actor: User,
    version: number,
  ) {
    if (targetId === sourceId)
      throw new BadRequestException('Source and target must differ');
    const result = await this.dataSource.transaction(async (m) => {
      const rows = await m
        .createQueryBuilder(Candidate, 'candidate')
        .setLock('pessimistic_write')
        .where('candidate.id IN (:...ids)', { ids: [targetId, sourceId] })
        .getMany();
      const target = rows.find((c) => c.id === targetId),
        source = rows.find((c) => c.id === sourceId);
      if (!target || !source || source.mergedInto)
        throw new NotFoundException('Source or target candidate not found');
      this.assertVersion(target, version);
      if (target.erasedAt || target.mergedInto || source.erasedAt)
        throw new ConflictException('Disposed candidates cannot be merged');
      const conflicts = await m.query(
        `SELECT a1."jobId" FROM applications a1 JOIN applications a2 ON a1."jobId"=a2."jobId" WHERE a1."candidateId"=$1 AND a2."candidateId"=$2 LIMIT 1`,
        [sourceId, targetId],
      );
      if (conflicts.length)
        throw new ConflictException(
          'Candidates have applications for the same job; resolve the duplicate application first',
        );
      await m.update(
        Application,
        { candidate: { id: sourceId } },
        { candidate: { id: targetId } },
      );
      await m.update(
        Interview,
        { candidate: { id: sourceId } },
        { candidate: { id: targetId } },
      );
      await m.update(
        CandidateHistory,
        { candidate: { id: sourceId } },
        { candidate: { id: targetId } },
      );
      target.tags = normalizeLabels([
        ...(target.tags ?? []),
        ...(source.tags ?? []),
      ]);
      target.skills = normalizeLabels([
        ...(target.skills ?? []),
        ...(source.skills ?? []),
      ]);
      await m.save(target);
      source.mergedInto = target;
      source.archivedAt = new Date();
      source.email = `merged-${source.id}@redacted.invalid`;
      source.normalizedEmail = source.email;
      source.phone = null as any;
      source.normalizedPhone = null as any;
      await m.save(source);
      return target;
    });
    await this.responses.updateMany(
      { candidateId: sourceId },
      { $set: { candidateId: targetId } },
    );
    await this.audit.record('candidate.merged', actor.id, undefined, {
      sourceCandidateId: sourceId,
      targetCandidateId: targetId,
    });
    await this.timeline.record({
      type: 'candidate.merged',
      actor,
      candidateId: targetId,
      targetType: TimelineTargetType.CANDIDATE,
      targetId,
      sourceType: 'candidate',
      sourceId: sourceId,
      metadata: { sourceCandidateId: sourceId },
    });
    return this.detailDto(result, actor);
  }
  async exportData(id: number, actor: User) {
    const candidate = await this.findEntity(id, true, actor);
    const applications = await this.dataSource
      .getRepository(Application)
      .find({ where: { candidate: { id } }, relations: { history: true } });
    const interviews = await this.dataSource
      .getRepository(Interview)
      .findBy({ candidate: { id } });
    const responses = await this.responses
      .find({ candidateId: id })
      .lean()
      .exec();
    await this.audit.record('candidate.privacy_exported', actor.id, undefined, {
      candidateId: id,
    });
    await this.timeline.record({
      type: 'candidate.privacy_exported',
      actor,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      sourceType: 'security_audit_event',
    });
    return {
      exportedAt: new Date(),
      candidate: this.listDto(candidate),
      applications,
      interviews,
      formResponses: responses,
    };
  }
  async requestDeletion(id: number, actor: User, version: number) {
    const c = await this.findEntity(id, true, actor);
    this.assertVersion(c, version);
    if (c.deletionRequestedAt)
      return { status: 'requested', requestedAt: c.deletionRequestedAt };
    c.deletionRequestedAt = new Date();
    await this.candidates.save(c);
    await this.audit.record(
      'candidate.deletion_requested',
      actor.id,
      undefined,
      { candidateId: id },
    );
    await this.timeline.record({
      type: 'candidate.deletion_requested',
      actor,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      sourceType: 'security_audit_event',
    });
    return { status: 'requested', requestedAt: c.deletionRequestedAt };
  }
  async erase(id: number, actor: User, version: number) {
    const c = await this.findEntity(id, true, actor);
    this.assertVersion(c, version);
    if (c.erasedAt) return this.detailDto(c, actor);
    if (c.retentionUntil && c.retentionUntil > new Date())
      throw new BadRequestException(
        'Candidate is under an active retention period',
      );
    c.firstName = 'Deleted';
    c.lastName = 'Candidate';
    c.email = `deleted-${c.id}@redacted.invalid`;
    c.normalizedEmail = c.email;
    c.phone = null as any;
    c.normalizedPhone = null as any;
    c.tags = [];
    c.skills = [];
    c.source = null as any;
    c.privacyConsent = false;
    c.consentAt = null as any;
    c.archivedAt = new Date();
    c.erasedAt = new Date();
    await this.candidates.save(c);
    await this.audit.record(
      'candidate.personal_data_erased',
      actor.id,
      undefined,
      { candidateId: id },
    );
    await this.timeline.record({
      type: 'candidate.personal_data_erased',
      actor,
      candidateId: id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: id,
      sourceType: 'security_audit_event',
    });
    return this.detailDto(c, actor);
  }
  async updateState(
    id: number,
    state: CandidateState,
    user: User,
    comment?: string,
    version?: number,
  ) {
    return this.dataSource.transaction(async (m) => {
      const candidate = await m.findOne(Candidate, { where: { id } });
      if (!candidate)
        throw new NotFoundException(`Candidate with ID ${id} not found`);
      this.assertVersion(candidate, version as number);
      if (candidate.archivedAt || candidate.mergedInto || candidate.erasedAt)
        throw new ConflictException('Candidate state cannot be changed');
      const previousState = candidate.currentState;
      candidate.currentState = state;
      await m.save(candidate);
      await m.save(
        m.create(CandidateHistory, {
          candidate,
          previousState,
          newState: state,
          comment,
          changedBy: user,
        }),
      );
      await this.timeline.record(
        {
          type: 'candidate.state_changed',
          actor: user,
          visibility: TimelineEventVisibility.CANDIDATE,
          candidateId: id,
          targetType: TimelineTargetType.CANDIDATE,
          targetId: id,
          sourceType: 'candidate_history',
          metadata: { previousState, newState: state, comment },
        },
        m,
      );
      return this.detailDto(candidate, user);
    });
  }
}
