import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import {
  BackgroundJob,
  JobStatus,
} from '../communications/entities/background-job.entity';
import { ReportingService } from './reporting.service';

@Injectable()
export class ReportExportWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(
    private db: DataSource,
    @InjectRepository(BackgroundJob) private jobs: Repository<BackgroundJob>,
    private reports: ReportingService,
  ) {}
  onModuleInit() {
    if (process.env.DISABLE_BACKGROUND_WORKERS === 'true') return;
    this.jobs
      .update(
        {
          name: 'generate-report-export',
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
      await this.reports.expireExports();
      const job = await this.claim();
      if (job) await this.process(job);
    } finally {
      this.running = false;
    }
  }
  private claim() {
    return this.db.transaction(async (manager) => {
      const job = await manager
        .createQueryBuilder(BackgroundJob, 'job')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where('job.name = :name', { name: 'generate-report-export' })
        .andWhere('job.status IN (:...statuses)', {
          statuses: [JobStatus.PENDING, JobStatus.RETRY],
        })
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
    const id = String(job.payload.exportId);
    try {
      await this.reports.generate(id);
      job.status = JobStatus.COMPLETED;
      job.lockedAt = null;
      await this.jobs.save(job);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown export error';
      job.lastError = message.slice(0, 2000);
      job.lockedAt = null;
      const dead = job.attempts >= job.maxAttempts;
      job.status = dead ? JobStatus.DEAD_LETTER : JobStatus.RETRY;
      job.runAt = new Date(
        Date.now() + Math.min(3600, 2 ** job.attempts * 30) * 1000,
      );
      await this.jobs.save(job);
      if (dead) await this.reports.fail(id, message);
    }
  }
}
