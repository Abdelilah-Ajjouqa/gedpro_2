import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn, VersionColumn } from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../users/entities/user.entity';
import { PipelineStage } from '../../pipelines/entities/pipeline-stage.entity';
import { ApplicationHistory } from './application-history.entity';

@Entity('applications')
@Unique(['candidate', 'job'])
export class Application {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Candidate, { eager: true, nullable: false, onDelete: 'CASCADE' }) candidate: Candidate;
  @ManyToOne(() => Job, (job) => job.applications, { eager: true, nullable: false, onDelete: 'CASCADE' }) job: Job;
  @ManyToOne(() => User, { eager: true, nullable: true }) owner?: User;
  @ManyToOne(() => PipelineStage, { eager: true, nullable: false, onDelete: 'RESTRICT' }) currentStage: PipelineStage;
  @Column({ nullable: true }) source?: string;
  @Column({ nullable: true }) rejectionReason?: string;
  @OneToMany(() => ApplicationHistory, (history) => history.application) history: ApplicationHistory[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @VersionColumn() version: number;
}
