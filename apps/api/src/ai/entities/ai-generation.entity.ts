import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AiGenerationType {
  CV_EXTRACTION = 'cv_extraction',
  SEARCH = 'search',
  JOB_MATCH = 'job_match',
  INTERVIEW_QUESTIONS = 'interview_questions',
  APPLICATION_SUMMARY = 'application_summary',
}

@Entity('ai_generations')
@Index(['type', 'createdAt'])
export class AiGeneration {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: AiGenerationType }) type: AiGenerationType;
  @Column() model: string;
  @Column() promptVersion: string;
  @Column({ type: 'jsonb', default: {} }) input: Record<string, unknown>;
  @Column({ type: 'jsonb', default: {} }) output: Record<string, unknown>;
  @Column({ default: 0 }) latencyMs: number;
  @Column({ default: 0 }) inputTokens: number;
  @Column({ default: 0 }) outputTokens: number;
  @Column({ type: 'decimal', precision: 12, scale: 6, default: 0 })
  costUsd: string;
  @Column({ default: true }) advisory: boolean;
  @Column({ default: false }) protectedInputsExcluded: boolean;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  requestedBy?: User | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
