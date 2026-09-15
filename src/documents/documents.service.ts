import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { User } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Role } from '../users/enums/role.enum';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private dataSource: DataSource,
    private timeline: TimelineService,
  ) {}

  async findAll(user: User) {
    return this.documentRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async create(file: Express.Multer.File, user: User, candidateId?: number) {
    let candidate: Candidate | null = null;
    if (candidateId)
      candidate = await this.dataSource
        .getRepository(Candidate)
        .findOneBy({ id: candidateId });
    else if (user.role === Role.CANDIDATE)
      candidate = await this.dataSource
        .getRepository(Candidate)
        .findOneBy({ normalizedEmail: user.email.trim().toLowerCase() });
    if (candidateId && !candidate)
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    if (
      user.role === Role.CANDIDATE &&
      candidateId &&
      candidate?.normalizedEmail !== user.email.trim().toLowerCase()
    )
      throw new ForbiddenException(
        'Candidates may only associate documents with their own record',
      );
    const newDoc = this.documentRepository.create({
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      user: user,
    });

    const saved = await this.documentRepository.save(newDoc);
    if (candidate)
      await this.timeline.record({
        type: 'document.uploaded',
        actor: user,
        visibility: TimelineEventVisibility.CANDIDATE,
        candidateId: candidate.id,
        targetType: TimelineTargetType.CANDIDATE,
        targetId: candidate.id,
        sourceType: 'document',
        sourceId: saved.id,
        metadata: {
          documentId: saved.id,
          originalName: saved.originalName,
          mimeType: saved.mimeType,
          size: saved.size,
        },
      });
    return saved;
  }
}
