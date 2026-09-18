import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { DataSource, LessThanOrEqual, Not, Repository } from 'typeorm';
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
  private isStaff(user: User) {
    return [Role.ADMIN, Role.RH, Role.MANAGER].includes(user.role);
  }
  private candidateFor(user: User) {
    return this.dataSource
      .getRepository(Candidate)
      .findOneBy({ normalizedEmail: user.email.trim().toLowerCase() });
  }
  private async assertAccess(doc: Document, user: User) {
    if (this.isStaff(user) || doc.user?.id === user.id) return;
    const own = await this.candidateFor(user);
    if (!own || doc.candidate?.id !== own.id)
      throw new ForbiddenException('Document access denied');
  }
  private relations() {
    return {
      user: true,
      candidate: true,
      application: { candidate: true },
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
  private publicDoc(doc: Document) {
    const safe: Partial<Document> = { ...doc };
    delete safe.path;
    return safe;
  }
  async findAll(
    user: User,
    candidateId?: number,
    applicationId?: number,
    includeArchived = false,
  ) {
    const where: any = {};
    if (!this.isStaff(user)) {
      const candidate = await this.candidateFor(user);
      if (candidate) where.candidate = { id: candidate.id };
      else where.user = { id: user.id };
    }
    if (candidateId) where.candidate = { id: candidateId };
    if (applicationId) where.application = { id: applicationId };
    where.status = includeArchived
      ? Not(DocumentStatus.DELETED)
      : DocumentStatus.ACTIVE;
    const docs = await this.documents.find({
      where,
      relations: this.relations(),
      order: { createdAt: 'DESC' },
    });
    for (const doc of docs) await this.assertAccess(doc, user);
    return docs.map((doc) => this.publicDoc(doc));
  }
  private async targets(dto: UploadDocumentDto, user: User) {
    let application: Application | null = null;
    let candidate: Candidate | null = null;
    if (dto.applicationId) {
      application = await this.dataSource.getRepository(Application).findOne({
        where: { id: dto.applicationId },
        relations: { candidate: true },
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
      return this.publicDoc(saved);
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
  ) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    if (doc.status !== DocumentStatus.ACTIVE)
      throw new ConflictException('Only an active document can be replaced');
    return this.create(
      file,
      user,
      { category: doc.category, retentionUntil: dto.retentionUntil },
      doc,
    );
  }
  async archive(id: number, user: User) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
    if (doc.status !== DocumentStatus.ARCHIVED) {
      doc.status = DocumentStatus.ARCHIVED;
      doc.archivedAt = new Date();
      await this.documents.save(doc);
      await this.record(doc, user, 'document.archived');
    }
    return this.publicDoc(doc);
  }
  async remove(id: number, user: User) {
    const doc = await this.get(id);
    await this.assertAccess(doc, user);
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
