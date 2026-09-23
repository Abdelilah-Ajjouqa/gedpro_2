import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import {
  DataSource,
  LessThanOrEqual,
  Not,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {
  ReplaceDocumentDto,
  UploadDocumentDto,
} from './dto/upload-document.dto';
import { Document, DocumentStatus } from './entities/document.entity';
import {
  DocumentAction,
  DocumentListResponseDto,
  DocumentSummaryDto,
} from './dto/document-response.dto';
import { DocumentSort, ListDocumentsDto } from './dto/list-documents.dto';
import { DocumentSecurityService } from './security/document-security';
import { DOCUMENT_STORAGE } from './storage/document-storage';
import type { DocumentStorage } from './storage/document-storage';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  constructor(
    @InjectRepository(Document)
    private readonly documents: Repository<Document>,
    private readonly dataSource: DataSource,
    private readonly timeline: TimelineService,
    private readonly security: DocumentSecurityService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}
  private candidateFor(user: User) {
    return this.dataSource
      .getRepository(Candidate)
      .findOneBy({ normalizedEmail: user.email.trim().toLowerCase() });
  }
  private async assertAccess(doc: Document, user: User) {
    if ([Role.ADMIN, Role.RH].includes(user.role)) return;
    if (
      user.role === Role.MANAGER &&
      doc.application?.job?.owner?.id === user.id
    )
      return;
    const own = await this.candidateFor(user);
    if (!own || doc.candidate?.id !== own.id)
      throw new NotFoundException(`Document with ID ${doc.id} not found`);
  }
  private relations() {
    return {
      user: true,
      candidate: true,
      application: { candidate: true, job: { owner: true } },
      replaces: true,
    } as const;
  }
  private async get(id: number) {
    const doc = await this.documents.findOne({
      where: { id },
      relations: this.relations(),
    });
    if (!doc || doc.status === DocumentStatus.DELETED)
      throw new NotFoundException(`Document with ID ${id} not found`);
    return doc;
  }
  private assertEtag(doc: Document, ifMatch?: string) {
    if (!ifMatch)
      throw new HttpException(
        {
          code: 'IF_MATCH_REQUIRED',
          message: 'This document must be refreshed before changing it',
        },
        HttpStatus.PRECONDITION_REQUIRED,
      );
    if (ifMatch !== `"${doc.revision}"`)
      throw new PreconditionFailedException({
        code: 'STALE_DOCUMENT',
        message: 'The document changed after it was loaded',
      });
  }
  private actions(doc: Document, actor: User): DocumentAction[] {
    const ownUpload = doc.user.id === actor.id;
    const managesJob = doc.application?.job?.owner?.id === actor.id;
    const mayMutate =
      [Role.ADMIN, Role.RH].includes(actor.role) ||
      (actor.role === Role.MANAGER && managesJob && ownUpload);
    return [
      'download',
      'preview',
      ...(doc.status === DocumentStatus.ACTIVE && mayMutate
        ? (['replace', 'archive'] as DocumentAction[])
        : []),
    ];
  }
  private publicDoc(doc: Document, actor: User): DocumentSummaryDto {
    return {
      id: doc.id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: Number(doc.size),
      category: doc.category,
      status: doc.status,
      version: doc.version,
      etag: `"${doc.revision}"`,
      createdAt: doc.createdAt,
      archivedAt: doc.archivedAt,
      retentionUntil: doc.retentionUntil,
      candidate: doc.candidate ? { id: doc.candidate.id } : undefined,
      application: doc.application ? { id: doc.application.id } : undefined,
      replacesId: doc.replaces?.id,
      allowedActions: this.actions(doc, actor),
    };
  }
  async findAll(
    user: User,
    query: ListDocumentsDto,
  ): Promise<DocumentListResponseDto> {
    const builder = this.documents
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.user', 'uploader')
      .leftJoinAndSelect('document.candidate', 'candidate')
      .leftJoinAndSelect('document.application', 'application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.owner', 'jobOwner')
      .leftJoinAndSelect('document.replaces', 'replaces');
    await this.scope(builder, user);
    builder
      .andWhere('document.status != :deleted', {
        deleted: DocumentStatus.DELETED,
      })
      .andWhere('document.status = :status', { status: query.status });
    if (query.candidateId)
      builder.andWhere('candidate.id = :candidateId', {
        candidateId: query.candidateId,
      });
    if (query.applicationId)
      builder.andWhere('application.id = :applicationId', {
        applicationId: query.applicationId,
      });
    if (query.category)
      builder.andWhere('document.category = :category', {
        category: query.category,
      });
    if (query.q)
      builder.andWhere('document.originalName ILIKE :q', {
        q: `%${query.q.replace(/[\\%_]/g, '\\$&')}%`,
      });
    const sort = {
      [DocumentSort.CREATED_AT]: 'document.createdAt',
      [DocumentSort.NAME]: 'document.originalName',
      [DocumentSort.CATEGORY]: 'document.category',
      [DocumentSort.STATUS]: 'document.status',
    }[query.sort];
    const direction = query.direction.toUpperCase() as 'ASC' | 'DESC';
    const [docs, total] = await builder
      .orderBy(sort, direction)
      .addOrderBy('document.id', direction)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      data: docs.map((doc) => this.publicDoc(doc, user)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  private async scope(builder: SelectQueryBuilder<Document>, user: User) {
    if (user.role === Role.MANAGER)
      builder.andWhere('jobOwner.id = :actorId', { actorId: user.id });
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateFor(user);
      if (candidate)
        builder.andWhere('candidate.id = :candidateOwnerId', {
          candidateOwnerId: candidate.id,
        });
      else builder.andWhere('1 = 0');
    }
  }
  private async targets(dto: UploadDocumentDto, user: User) {
    let application: Application | null = null;
    let candidate: Candidate | null = null;
    if (dto.applicationId) {
      application = await this.dataSource.getRepository(Application).findOne({
        where: { id: dto.applicationId },
        relations: { candidate: true, job: { owner: true } },
      });
      if (!application)
        throw new NotFoundException(
          `Application with ID ${dto.applicationId} not found`,
        );
      candidate = application.candidate;
      if (dto.candidateId && dto.candidateId !== candidate.id)
        throw new BadRequestException(
          'Application does not belong to candidate',
        );
    } else if (dto.candidateId)
      candidate = await this.dataSource
        .getRepository(Candidate)
        .findOneBy({ id: dto.candidateId });
    else if (user.role === Role.CANDIDATE)
      candidate = await this.candidateFor(user);
    if (!candidate)
      throw new BadRequestException('candidateId or applicationId is required');
    if (user.role === Role.MANAGER) {
      if (!application || application.job.owner.id !== user.id)
        throw new NotFoundException('Application not found');
    }
    if (
      user.role === Role.CANDIDATE &&
      candidate.normalizedEmail !== user.email.trim().toLowerCase()
    )
      throw new ForbiddenException(
        'Candidates may only manage their own documents',
      );
    return { candidate, application };
  }
  async create(
    file: Express.Multer.File,
    user: User,
    dto: UploadDocumentDto,
    replaces?: Document,
  ) {
    if (!file?.buffer) throw new BadRequestException('File is required');
    const target = replaces
      ? {
          candidate: replaces.candidate!,
          application: replaces.application ?? null,
        }
      : await this.targets(dto, user);
    const scan = this.security.inspect(file);
    const duplicate = await this.documents.findOne({
      where: {
        checksum: scan.checksum,
        candidate: { id: target.candidate.id },
        status: Not(DocumentStatus.DELETED),
      },
    });
    if (duplicate)
      throw new ConflictException(
        `Duplicate document content already exists as document ${duplicate.id}`,
      );
    const key = `${target.candidate.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${scan.extension}`;
    await this.storage.put(key, file.buffer, scan.mimeType);
    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        if (replaces) {
          replaces.status = DocumentStatus.ARCHIVED;
          replaces.archivedAt = new Date();
          await manager.save(replaces);
        }
        return manager.save(
          manager.create(Document, {
            originalName: file.originalname.slice(0, 255),
            filename: key.split('/').pop()!,
            mimeType: scan.mimeType,
            size: file.size,
            path: key,
            storageProvider: this.storage.name,
            checksum: scan.checksum,
            category: replaces?.category ?? dto.category,
            version: (replaces?.version ?? 0) + 1,
            replaces: replaces ?? null,
            user,
            candidate: target.candidate,
            application: target.application,
            retentionUntil:
              dto.retentionUntil ?? replaces?.retentionUntil ?? null,
          }),
        );
      });
      await this.record(
        saved,
        user,
        replaces ? 'document.replaced' : 'document.uploaded',
      );
      return this.publicDoc(saved, user);
    } catch (error) {
      await this.storage
        .delete(key)
        .catch((cleanup) =>
          this.logger.error(`orphan cleanup failed for ${key}`, cleanup),
        );
      throw error;
    }
  }
  private record(doc: Document, actor: User, type: string) {
    return this.timeline.record({
      type,
      actor,
      visibility: TimelineEventVisibility.CANDIDATE,
      candidateId: doc.candidate!.id,
      applicationId: doc.application?.id,
      targetType: doc.application
        ? TimelineTargetType.APPLICATION
        : TimelineTargetType.CANDIDATE,
      targetId: doc.application?.id ?? doc.candidate!.id,
      sourceType: 'document',
      sourceId: doc.id,
      metadata: {
        documentId: doc.id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: Number(doc.size),
        category: doc.category,
        version: doc.version,
      },
    });
  }
  async replace(
    id: number,
    file: Express.Multer.File,
    dto: ReplaceDocumentDto,
    user: User,
    ifMatch?: string,
  ) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    this.assertEtag(doc, ifMatch);
    if (doc.status !== DocumentStatus.ACTIVE)
      throw new ConflictException('Only an active document can be replaced');
    return this.create(
      file,
      user,
      { category: doc.category, retentionUntil: dto.retentionUntil },
      doc,
    );
  }
  async archive(id: number, user: User, ifMatch?: string) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    this.assertEtag(doc, ifMatch);
    if (doc.status !== DocumentStatus.ARCHIVED) {
      doc.status = DocumentStatus.ARCHIVED;
      doc.archivedAt = new Date();
      await this.documents.save(doc);
      await this.record(doc, user, 'document.archived');
    }
    return this.publicDoc(doc, user);
  }
  async remove(id: number, user: User, ifMatch?: string) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    this.assertEtag(doc, ifMatch);
    if (user.role !== Role.ADMIN)
      throw new NotFoundException(`Document with ID ${id} not found`);
    await this.storage.delete(doc.path);
    doc.status = DocumentStatus.DELETED;
    doc.deletedAt = new Date();
    await this.documents.save(doc);
    await this.record(doc, user, 'document.deleted');
  }
  async download(id: number, user: User) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    return { doc, ...(await this.storage.get(doc.path)) };
  }
  private sign(value: string) {
    return createHmac('sha256', process.env.JWT_SECRET!)
      .update(value)
      .digest('base64url');
  }
  async expiringUrl(id: number, user: User) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    const ttl = Number(process.env.DOCUMENT_URL_TTL_SECONDS ?? 300);
    if (this.storage.signedUrl)
      return {
        url: await this.storage.signedUrl(doc.path, ttl),
        expiresIn: ttl,
      };
    const expires = Math.floor(Date.now() / 1000) + ttl;
    const token = `${expires}.${this.sign(`${id}.${expires}`)}`;
    return {
      url: `${process.env.APP_BASE_URL ?? ''}/document-download/${id}?token=${token}`,
      expiresIn: ttl,
    };
  }
  async signedDownload(id: number, token: string) {
    const [expiresText, signature] = (token ?? '').split('.');
    const expires = Number(expiresText);
    const expected = this.sign(`${id}.${expiresText}`);
    if (
      !expires ||
      expires < Math.floor(Date.now() / 1000) ||
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw new ForbiddenException('Download URL is invalid or expired');
    const doc = await this.get(id);
    return { doc, ...(await this.storage.get(doc.path)) };
  }
  async cleanupExpired() {
    const expired = await this.documents.find({
      where: {
        retentionUntil: LessThanOrEqual(new Date()),
        status: Not(DocumentStatus.DELETED),
      },
      relations: this.relations(),
    });
    let removed = 0,
      failed = 0;
    for (const doc of expired) {
      try {
        await this.storage.delete(doc.path);
        doc.status = DocumentStatus.DELETED;
        doc.deletedAt = new Date();
        await this.documents.save(doc);
        removed++;
      } catch (error) {
        failed++;
        this.logger.error(
          `retention cleanup failed for document ${doc.id}`,
          error,
        );
      }
    }
    this.logger.log(
      `document retention cleanup scanned=${expired.length} removed=${removed} failed=${failed}`,
    );
    return { scanned: expired.length, removed, failed };
  }
  cleanupOrphans() {
    return {
      provider: this.storage.name,
      status: 'metadata-coordinated',
      note: 'Failed metadata writes are deleted immediately; repeated cleanup calls are safe',
    };
  }
}
