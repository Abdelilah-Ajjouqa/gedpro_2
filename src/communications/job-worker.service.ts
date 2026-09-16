import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { EMAIL_PROVIDER } from './email-provider';
import type { EmailProvider } from './email-provider';
import { BackgroundJob, JobStatus } from './entities/background-job.entity';
import { Communication, DeliveryStatus } from './entities/communication.entity';

@Injectable()
export class JobWorkerService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(
    private dataSource: DataSource,
    @InjectRepository(BackgroundJob) private jobs: Repository<BackgroundJob>,
    @InjectRepository(Communication)
    private messages: Repository<Communication>,
    @Inject(EMAIL_PROVIDER) private provider: EmailProvider,
  ) {}
  onModuleInit() {
    this.jobs
      .update(
        {
          status: JobStatus.PROCESSING,
          lockedAt: LessThan(new Date(Date.now() - 5 * 60_000)),
        },
        { status: JobStatus.RETRY, lockedAt: null, runAt: new Date() },
      )
      .catch(() => undefined);
    this.timer = setInterval(
      () => void this.tick(),
      Number(process.env.JOB_POLL_INTERVAL_MS ?? 1000),
    );
    this.timer.unref();
    void this.tick();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const job = await this.claim();
      if (job) await this.process(job);
    } finally {
      this.running = false;
    }
  }
  private claim() {
    return this.dataSource.transaction(async (manager) => {
      const job = await manager
        .createQueryBuilder(BackgroundJob, 'job')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where('job.status IN (:...statuses)', {
          statuses: [JobStatus.PENDING, JobStatus.RETRY],
        })
        .andWhere('job.name = :name', { name: 'send-email' })
        .andWhere('job.runAt <= NOW()')
        .orderBy('job.runAt', 'ASC')
        .getOne();
      if (!job) return null;
      job.status = JobStatus.PROCESSING;
      job.lockedAt = new Date();
      job.attempts += 1;
      return manager.save(job);
    });
  }
  private async process(job: BackgroundJob) {
    try {
      if (job.name !== 'send-email')
        throw new Error(`Unknown job: ${job.name}`);
      const id = String(job.payload.communicationId);
      const message = await this.messages.findOne({
        where: { id },
        select: {
          id: true,
          recipient: true,
          subject: true,
          htmlBody: true,
          idempotencyKey: true,
          status: true,
          providerMessageId: true,
          attempts: true,
        },
      });
      if (!message) throw new Error('Communication no longer exists');
      if (
        [DeliveryStatus.SENT, DeliveryStatus.DELIVERED].includes(
          message.status,
        ) ||
        message.providerMessageId
      ) {
        job.status = JobStatus.COMPLETED;
        await this.jobs.save(job);
        return;
      }
      message.status = DeliveryStatus.SENDING;
      message.attempts += 1;
      await this.messages.save(message);
      const result = await this.provider.send({
        to: message.recipient,
        subject: message.subject,
        html: message.htmlBody,
        idempotencyKey: message.idempotencyKey,
      });
      message.providerMessageId = result.messageId;
      message.status = DeliveryStatus.SENT;
      message.sentAt = new Date();
      message.lastError = null;
      job.status = JobStatus.COMPLETED;
      job.lockedAt = null;
      await this.messages.save(message);
      await this.jobs.save(job);
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message.slice(0, 2000)
          : 'Unknown job error';
      job.lastError = detail;
      job.lockedAt = null;
      const dead = job.attempts >= job.maxAttempts;
      job.status = dead ? JobStatus.DEAD_LETTER : JobStatus.RETRY;
      job.runAt = new Date(
        Date.now() + Math.min(3600, 2 ** job.attempts * 30) * 1000,
      );
      await this.jobs.save(job);
      const id = String(job.payload.communicationId ?? '');
      if (id)
        await this.messages.update(id, {
          status: dead ? DeliveryStatus.DEAD_LETTER : DeliveryStatus.FAILED,
          lastError: detail,
        });
    }
  }
}
