import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { PipelineStage } from '../../pipelines/entities/pipeline-stage.entity';

export interface ScorecardCriterion {
  key: string;
  label: string;
  description?: string;
  minRating: number;
  maxRating: number;
  required: boolean;
}
@Entity('scorecard_templates')
export class ScorecardTemplate {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'jsonb' }) criteria: ScorecardCriterion[];
  @ManyToOne(() => Job, { eager: true, nullable: true, onDelete: 'CASCADE' })
  job: Job | null;
  @ManyToOne(() => PipelineStage, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  stage: PipelineStage | null;
  @Column({ default: false }) archived: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
