import { Application } from '../../applications/entities/application.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum DocumentCategory {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  PORTFOLIO = 'portfolio',
  OFFER = 'offer',
  OTHER = 'other',
}
export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('documents')
@Index(['checksum'])
@Index(['candidate', 'createdAt'])
@Index(['application', 'createdAt'])
export class Document {
  @PrimaryGeneratedColumn() id: number;
  @Column() originalName: string;
  @Column() filename: string;
  @Column() mimeType: string;
  @Column({ type: 'bigint' }) size: number;
  @Column() path: string;
  @Column({ default: 'local' }) storageProvider: string;
  @Column({ length: 64 }) checksum: string;
  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  category: DocumentCategory;
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.ACTIVE,
  })
  status: DocumentStatus;
  @Column({ default: 1 }) version: number;
  @ManyToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  replaces?: Document | null;
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' }) user: User;
  @ManyToOne(() => Candidate, { nullable: true, onDelete: 'CASCADE' })
  candidate?: Candidate | null;
  @ManyToOne(() => Application, { nullable: true, onDelete: 'CASCADE' })
  application?: Application | null;
  @Column({ type: 'timestamptz', nullable: true }) archivedAt?: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) deletedAt?: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) retentionUntil?: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
