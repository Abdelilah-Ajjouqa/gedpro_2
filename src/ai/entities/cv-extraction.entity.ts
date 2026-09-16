import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Document } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';
import { AiGeneration } from './ai-generation.entity';

@Entity('cv_extractions')
export class CvExtraction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Candidate, { nullable: false, onDelete: 'CASCADE' })
  candidate: Candidate;
  @ManyToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  document?: Document | null;
  @ManyToOne(() => AiGeneration, { nullable: false, onDelete: 'CASCADE' })
  generation: AiGeneration;
  @Column({ type: 'jsonb' }) extracted: Record<string, unknown>;
  @Column({ type: 'jsonb', nullable: true }) corrected?: Record<
    string,
    unknown
  > | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  correctedBy?: User | null;
  @Column({ type: 'timestamptz', nullable: true }) correctedAt?: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
