import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  RETRY = 'retry',
  DEAD_LETTER = 'dead_letter',
}
@Entity('background_jobs')
@Index(['status', 'runAt'])
export class BackgroundJob {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() queue: string;
  @Column() name: string;
  @Column({ type: 'jsonb', default: {} }) payload: Record<string, unknown>;
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;
  @Index({ unique: true }) @Column() idempotencyKey: string;
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ type: 'integer', default: 5 }) maxAttempts: number;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  runAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) lockedAt: Date | null;
  @Column({ type: 'text', nullable: true }) lastError: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
