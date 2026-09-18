/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DataSource, LessThan, Repository } from 'typeorm';
import { BackgroundJob } from '../communications/entities/background-job.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateReportExportDto, ReportQueryDto } from './dto/reporting.dto';
import {
  ReportExport,
  ReportExportFormat,
  ReportExportStatus,
} from './entities/report-export.entity';
import ExcelJS from 'exceljs';

@Injectable()
export class ReportingService {
  constructor(
    private db: DataSource,
    @InjectRepository(ReportExport) private exports: Repository<ReportExport>,
    @InjectRepository(BackgroundJob) private jobs: Repository<BackgroundJob>,
  ) {}
  private boundaries(q: ReportQueryDto) {
    const from = q.from
      ? new Date(q.from)
      : new Date('1970-01-01T00:00:00.000Z');
    const to = q.to ? new Date(q.to) : new Date();
    if (from >= to) throw new BadRequestException('from must be before to');
    return { from, to };
  }
  private scope(user: User, alias = 'j') {
    return user.role === Role.MANAGER
      ? ` AND ${alias}."ownerId" = ${Number(user.id)}`
      : '';
  }
  async summary(q: ReportQueryDto, user: User) {
    const { from, to } = this.boundaries(q);
    const args: unknown[] = [from, to];
    const job = q.jobId ? ` AND j.id = $3` : '';
    if (q.jobId) args.push(q.jobId);
    const scope = this.scope(user);
    const funnel = await this.db.query(
      `SELECT s.id AS "stageId",s.name,s.category,COUNT(DISTINCT h."applicationId")::int AS count FROM application_history h JOIN applications a ON a.id=h."applicationId" JOIN jobs j ON j.id=a."jobId" JOIN pipeline_stages s ON s.id=h."newStageId" WHERE h."changedAt">=$1 AND h."changedAt"<$2${job}${scope} GROUP BY s.id,s.name,s.category,s.position ORDER BY s.position`,
      args,
    );
    const totals = await this.db.query(
      `SELECT COUNT(*)::int AS applications,COUNT(*) FILTER(WHERE s.category='hired')::int AS hired,AVG(EXTRACT(EPOCH FROM (first_review.ts-a."createdAt"))/3600)::float AS "avgHoursToFirstReview",AVG(EXTRACT(EPOCH FROM (hired.ts-a."createdAt"))/86400)::float AS "avgDaysToHire" FROM applications a JOIN jobs j ON j.id=a."jobId" JOIN pipeline_stages s ON s.id=a."currentStageId" LEFT JOIN LATERAL(SELECT MIN(h."changedAt") ts FROM application_history h JOIN pipeline_stages hs ON hs.id=h."newStageId" WHERE h."applicationId"=a.id AND hs.category<>'applied') first_review ON true LEFT JOIN LATERAL(SELECT MIN(h."changedAt") ts FROM application_history h JOIN pipeline_stages hs ON hs.id=h."newStageId" WHERE h."applicationId"=a.id AND hs.category='hired') hired ON true WHERE a."createdAt">=$1 AND a."createdAt"<$2${job}${scope}`,
      args,
    );
    const timeInStage = await this.db.query(
      `WITH visits AS (SELECT h."applicationId",h."newStageId",h."changedAt",LEAD(h."changedAt") OVER(PARTITION BY h."applicationId" ORDER BY h."changedAt",h.id) left_at FROM application_history h) SELECT s.id AS "stageId",s.name,AVG(EXTRACT(EPOCH FROM (COALESCE(v.left_at,NOW())-v."changedAt"))/3600)::float AS "avgHours" FROM visits v JOIN applications a ON a.id=v."applicationId" JOIN jobs j ON j.id=a."jobId" JOIN pipeline_stages s ON s.id=v."newStageId" WHERE v."changedAt">=$1 AND v."changedAt"<$2${job}${scope} GROUP BY s.id,s.name,s.position ORDER BY s.position`,
      args,
    );
    const rejectionReasons = await this.db.query(
      `SELECT COALESCE(a."rejectionReason",'Unspecified') reason,COUNT(*)::int count FROM applications a JOIN jobs j ON j.id=a."jobId" JOIN pipeline_stages s ON s.id=a."currentStageId" WHERE a."createdAt">=$1 AND a."createdAt"<$2 AND s.category='rejected'${job}${scope} GROUP BY 1 ORDER BY count DESC`,
      args,
    );
    const sources = await this.db.query(
      `SELECT COALESCE(a.source,'Unknown') source,COUNT(*)::int applications,COUNT(*) FILTER(WHERE s.category='hired')::int hired FROM applications a JOIN jobs j ON j.id=a."jobId" JOIN pipeline_stages s ON s.id=a."currentStageId" WHERE a."createdAt">=$1 AND a."createdAt"<$2${job}${scope} GROUP BY 1 ORDER BY applications DESC`,
      args,
    );
    const recruiters = await this.db.query(
      `SELECT u.id,CONCAT(u."firstName",' ',u."lastName") recruiter,COUNT(a.id)::int applications FROM users u LEFT JOIN applications a ON a."ownerId"=u.id AND a."createdAt">=$1 AND a."createdAt"<$2 LEFT JOIN jobs j ON j.id=a."jobId" WHERE u.role IN('rh','manager')${q.jobId ? ' AND j.id=$3' : ''}${user.role === Role.MANAGER ? ` AND u.id=${Number(user.id)}` : ''} GROUP BY u.id ORDER BY applications DESC`,
      args,
    );
    const interviewers = await this.db.query(
      `SELECT u.id,CONCAT(u."firstName",' ',u."lastName") interviewer,COUNT(i.id)::int interviews,COUNT(sc.id) FILTER(WHERE sc."submittedAt" IS NULL)::int AS "pendingScorecards" FROM users u LEFT JOIN interviews i ON i."interviewerId"=u.id AND i.date>=$1 AND i.date<$2 LEFT JOIN applications a ON a.id=i."applicationId" LEFT JOIN jobs j ON j.id=a."jobId" LEFT JOIN scorecards sc ON sc."interviewId"=i.id WHERE u.role<>'candidate'${job}${this.scope(user)} GROUP BY u.id ORDER BY interviews DESC`,
      args,
    );
    const jobs = await this.db.query(
      `SELECT j.id,j.title,COUNT(a.id)::int applications,COUNT(a.id) FILTER(WHERE s.category='hired')::int hired FROM jobs j LEFT JOIN applications a ON a."jobId"=j.id AND a."createdAt">=$1 AND a."createdAt"<$2 LEFT JOIN pipeline_stages s ON s.id=a."currentStageId" WHERE 1=1${q.jobId ? ' AND j.id=$3' : ''}${scope} GROUP BY j.id ORDER BY applications DESC`,
      args,
    );
    const entered = funnel[0]?.count ?? 0;
    for (const stage of funnel)
      stage.conversionFromFirstStage = entered
        ? Number(stage.count) / Number(entered)
        : 0;
    return {
      boundaries: { from: from.toISOString(), toExclusive: to.toISOString() },
      funnel,
      timeInStage,
      totals: totals[0],
      rejectionReasons,
      sources,
      recruiters,
      interviewers,
      jobs,
    };
  }
  async createExport(dto: CreateReportExportDto, user: User) {
    this.boundaries(dto);
    const expiresAt = new Date(
      Date.now() +
        Number(process.env.REPORT_EXPORT_TTL_SECONDS ?? 86400) * 1000,
    );
    const filters: Record<string, unknown> = { format: dto.format };
    if (dto.from) filters.from = dto.from;
    if (dto.to) filters.to = dto.to;
    if (dto.jobId) filters.jobId = dto.jobId;
    const record = await this.exports.save(
      this.exports.create({
        requestedBy: user,
        format: dto.format,
        filters,
        expiresAt,
      }),
    );
    await this.jobs.save(
      this.jobs.create({
        queue: 'exports',
        name: 'generate-report-export',
        idempotencyKey: `report:${record.id}`,
        payload: { exportId: record.id },
        maxAttempts: 3,
      }),
    );
    return record;
  }
  async listExports(user: User) {
    return this.exports.find({
      where: user.role === Role.ADMIN ? {} : { requestedBy: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }
  async getExport(id: string, user: User) {
    const row = await this.exports.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Export not found');
    if (user.role !== Role.ADMIN && row.requestedBy.id !== user.id)
      throw new ForbiddenException();
    if (row.expiresAt <= new Date()) {
      row.status = ReportExportStatus.EXPIRED;
      if (row.objectKey)
        await unlink(this.path(row.objectKey)).catch(() => undefined);
      row.objectKey = null;
      await this.exports.save(row);
    }
    return row;
  }
  async download(id: string, user: User) {
    const row = await this.getExport(id, user);
    if (row.status !== ReportExportStatus.COMPLETED || !row.objectKey)
      throw new BadRequestException('Export is not available');
    return { row, data: await readFile(this.path(row.objectKey)) };
  }
  private path(key: string) {
    return resolve(process.env.REPORT_EXPORT_DIR ?? 'uploads/reports', key);
  }
  async generate(id: string) {
    const row = await this.exports.findOne({ where: { id } });
    if (!row || row.status === ReportExportStatus.COMPLETED) return;
    row.status = ReportExportStatus.PROCESSING;
    await this.exports.save(row);
    const data = await this.summary(
      row.filters as ReportQueryDto,
      row.requestedBy,
    );
    const records = this.flatten(data);
    const key = `${row.id}.${row.format}`;
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    if (row.format === ReportExportFormat.CSV)
      await writeFile(path, this.csv(records));
    else {
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet('Report');
      sheet.columns = Object.keys(records[0] ?? { metric: '' }).map((k) => ({
        header: k,
        key: k,
      }));
      sheet.addRows(records);
      await book.xlsx.writeFile(path);
    }
    row.objectKey = key;
    row.size = (await stat(path)).size;
    row.status = ReportExportStatus.COMPLETED;
    row.completedAt = new Date();
    row.error = null;
    await this.exports.save(row);
  }
  async fail(id: string, error: string) {
    await this.exports.update(id, {
      status: ReportExportStatus.FAILED,
      error: error.slice(0, 2000),
    });
  }
  async expireExports() {
    const rows = await this.exports.find({
      where: { expiresAt: LessThan(new Date()) },
    });
    for (const row of rows) {
      if (row.status === ReportExportStatus.EXPIRED) continue;
      if (row.objectKey)
        await unlink(this.path(row.objectKey)).catch(() => undefined);
      row.objectKey = null;
      row.status = ReportExportStatus.EXPIRED;
      await this.exports.save(row);
    }
  }
  private flatten(data: Record<string, unknown>) {
    const rows: Record<string, unknown>[] = [];
    for (const [section, values] of Object.entries(data)) {
      if (Array.isArray(values))
        for (const value of values)
          rows.push({ section, ...(value as object) });
      else if (section === 'totals')
        rows.push({ section, ...(values as object) });
    }
    return rows;
  }
  private csv(rows: Record<string, unknown>[]) {
    const keys = [...new Set(rows.flatMap(Object.keys))];
    const esc = (v: unknown) => {
      const value =
        v === null || v === undefined
          ? ''
          : typeof v === 'object'
            ? JSON.stringify(v)
            : String(v as string | number | boolean);
      return `"${value.replace(/"/g, '""')}"`;
    };
    return [
      keys.map(esc).join(','),
      ...rows.map((r) => keys.map((k) => esc(r[k])).join(',')),
    ].join('\r\n');
  }
}
