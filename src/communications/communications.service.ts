import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Interview } from '../interviews/entities/interview.entity';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {
  CommunicationQueryDto,
  CreateTemplateDto,
  PreferenceDto,
  QueueCommunicationDto,
  WebhookDto,
} from './dto/communication.dto';
import { BackgroundJob, JobStatus } from './entities/background-job.entity';
import {
  Communication,
  CommunicationType,
  DeliveryStatus,
} from './entities/communication.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

const DEFAULT_TEMPLATES: Record<CommunicationType, string> = {
  [CommunicationType.APPLICATION_ACKNOWLEDGEMENT]:
    'application-acknowledgement',
  [CommunicationType.INTERVIEW_INVITATION]: 'interview-invitation',
  [CommunicationType.INTERVIEW_REMINDER]: 'interview-reminder',
  [CommunicationType.REJECTION]: 'rejection',
  [CommunicationType.OFFER]: 'offer',
  [CommunicationType.PASSWORD_RESET]: 'password-reset',
  [CommunicationType.EMAIL_VERIFICATION]: 'email-verification',
  [CommunicationType.CUSTOM]: 'custom',
};

@Injectable()
export class CommunicationsService {
  constructor(
    @InjectRepository(EmailTemplate)
    private templates: Repository<EmailTemplate>,
    @InjectRepository(Communication)
    private messages: Repository<Communication>,
    @InjectRepository(BackgroundJob) private jobs: Repository<BackgroundJob>,
    @InjectRepository(NotificationPreference)
    private preferences: Repository<NotificationPreference>,
    @InjectRepository(Candidate) private candidates: Repository<Candidate>,
    @InjectRepository(Application)
    private applications: Repository<Application>,
    @InjectRepository(Interview) private interviews: Repository<Interview>,
    private timeline: TimelineService,
    private config: ConfigService,
  ) {}

  private escape(value: unknown) {
    return String(value ?? '').replace(
      /[&<>'"]/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[c]!,
    );
  }
  private render(text: string, variables: Record<string, unknown>) {
    return text.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key) =>
      this.escape(variables[key]),
    );
  }
  async createTemplate(dto: CreateTemplateDto) {
    const latest = await this.templates.findOne({
      where: { key: dto.key },
      order: { version: 'DESC' },
    });
    if (latest)
      await this.templates.update(
        { key: dto.key, active: true },
        { active: false },
      );
    return this.templates.save(
      this.templates.create({
        ...dto,
        version: (latest?.version ?? 0) + 1,
        active: true,
      }),
    );
  }
  listTemplates() {
    return this.templates.find({ order: { key: 'ASC', version: 'DESC' } });
  }

  private async preferenceAllows(
    candidate: Candidate | null,
    type: CommunicationType,
  ) {
    if (!candidate) return true;
    const p = await this.preferences.findOne({
      where: { candidate: { id: candidate.id } },
    });
    if (!p) return true;
    if (type === CommunicationType.APPLICATION_ACKNOWLEDGEMENT)
      return p.applicationUpdates;
    if (
      [
        CommunicationType.INTERVIEW_INVITATION,
        CommunicationType.INTERVIEW_REMINDER,
      ].includes(type)
    )
      return p.interviewUpdates;
    if ([CommunicationType.REJECTION, CommunicationType.OFFER].includes(type))
      return p.outcomeUpdates;
    return true;
  }
  async queue(dto: QueueCommunicationDto, actor: User | null = null) {
    const existing = await this.messages.findOneBy({
      idempotencyKey: dto.idempotencyKey,
    });
    if (existing) return existing;
    const application = dto.applicationId
      ? await this.applications.findOne({
          where: { id: dto.applicationId },
          relations: { candidate: true, job: true },
        })
      : null;
    const interview = dto.interviewId
      ? await this.interviews.findOne({
          where: { id: dto.interviewId },
          relations: { candidate: true, application: true },
        })
      : null;
    const candidate = dto.candidateId
      ? await this.candidates.findOneBy({ id: dto.candidateId })
      : (application?.candidate ?? interview?.candidate ?? null);
    if (dto.applicationId && !application)
      throw new NotFoundException('Application not found');
    if (dto.interviewId && !interview)
      throw new NotFoundException('Interview not found');
    if (dto.candidateId && !candidate)
      throw new NotFoundException('Candidate not found');
    if (!(await this.preferenceAllows(candidate, dto.type)))
      throw new ForbiddenException(
        'Candidate notification preference disables this message',
      );
    const key = dto.templateKey ?? DEFAULT_TEMPLATES[dto.type];
    const template = await this.templates.findOne({
      where: { key, active: true },
      order: { version: 'DESC' },
    });
    if (!template)
      throw new BadRequestException(`Active email template '${key}' not found`);
    const recipient = dto.recipient ?? candidate?.email;
    if (!recipient)
      throw new BadRequestException(
        'A recipient or candidate reference is required',
      );
    const variables = {
      firstName: candidate?.firstName,
      lastName: candidate?.lastName,
      jobTitle: application?.job?.title,
      interviewDate: interview?.date?.toISOString(),
      ...(dto.variables ?? {}),
    };
    try {
      const message = await this.messages.save(
        this.messages.create({
          type: dto.type,
          recipient: recipient.toLowerCase(),
          subject: this.render(template.subject, variables),
          htmlBody: this.render(template.htmlBody, variables),
          idempotencyKey: dto.idempotencyKey,
          template,
          candidate,
          application,
          interview,
          createdBy: actor,
          status: DeliveryStatus.QUEUED,
          provider: this.config.get('EMAIL_PROVIDER') ?? 'log',
        }),
      );
      await this.jobs.save(
        this.jobs.create({
          queue: 'email',
          name: 'send-email',
          payload: { communicationId: message.id },
          idempotencyKey: `email:${message.id}`,
          status: JobStatus.PENDING,
          runAt: new Date(),
          maxAttempts: Number(this.config.get('EMAIL_MAX_ATTEMPTS') ?? 5),
        }),
      );
      if (candidate)
        await this.timeline.record({
          type: 'communication.queued',
          actor,
          visibility: TimelineEventVisibility.CANDIDATE,
          candidateId: candidate.id,
          applicationId: application?.id ?? interview?.application?.id ?? null,
          targetType:
            application || interview?.application
              ? TimelineTargetType.APPLICATION
              : TimelineTargetType.CANDIDATE,
          targetId:
            application?.id ?? interview?.application?.id ?? candidate.id,
          sourceType: 'communication',
          sourceId: message.id,
          metadata: {
            communicationId: message.id,
            communicationType: message.type,
            status: message.status,
          },
        });
      return message;
    } catch (error: any) {
      if (error?.code === '23505')
        return this.messages.findOneByOrFail({
          idempotencyKey: dto.idempotencyKey,
        });
      throw error;
    }
  }
  list(query: CommunicationQueryDto) {
    return this.messages.find({
      where: {
        ...(query.candidateId ? { candidate: { id: query.candidateId } } : {}),
        ...(query.applicationId
          ? { application: { id: query.applicationId } }
          : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }
  async retry(id: string) {
    const message = await this.messages.findOneBy({ id });
    if (!message) throw new NotFoundException('Communication not found');
    if (
      ![
        DeliveryStatus.FAILED,
        DeliveryStatus.DEAD_LETTER,
        DeliveryStatus.BOUNCED,
      ].includes(message.status)
    )
      throw new ConflictException('Only failed communications can be retried');
    message.status = DeliveryStatus.QUEUED;
    message.lastError = null;
    await this.messages.save(message);
    await this.jobs.upsert(
      {
        queue: 'email',
        name: 'send-email',
        payload: { communicationId: id },
        idempotencyKey: `email:${id}:retry:${message.attempts}`,
        status: JobStatus.PENDING,
        attempts: 0,
        maxAttempts: Number(this.config.get('EMAIL_MAX_ATTEMPTS') ?? 5),
        runAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
      ['idempotencyKey'],
    );
    return message;
  }
  async getPreferences(candidateId: number) {
    return (
      (await this.preferences.findOne({
        where: { candidate: { id: candidateId } },
      })) ?? {
        candidateId,
        applicationUpdates: true,
        interviewUpdates: true,
        outcomeUpdates: true,
      }
    );
  }
  async setPreferences(candidateId: number, dto: PreferenceDto, actor: User) {
    const candidate = await this.candidates.findOneBy({ id: candidateId });
    if (!candidate) throw new NotFoundException('Candidate not found');
    if (
      actor.role === Role.CANDIDATE &&
      actor.email.toLowerCase() !== candidate.normalizedEmail
    )
      throw new ForbiddenException(
        'Candidates may only update their own preferences',
      );
    let row = await this.preferences.findOne({
      where: { candidate: { id: candidateId } },
    });
    row = this.preferences.create({ ...(row ?? {}), candidate, ...dto });
    return this.preferences.save(row);
  }
  async webhook(dto: WebhookDto, signature: string | undefined, raw: string) {
    const secret = this.config.getOrThrow<string>('EMAIL_WEBHOOK_SECRET');
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(signature ?? ''),
      b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new ForbiddenException('Invalid webhook signature');
    const message = await this.messages.findOneBy({
      providerMessageId: dto.providerMessageId,
    });
    if (!message) throw new NotFoundException('Communication not found');
    message.status = dto.status;
    message.lastError = dto.error ?? null;
    if (dto.status === DeliveryStatus.DELIVERED)
      message.deliveredAt = new Date();
    return this.messages.save(message);
  }
}
