import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';
import { JobStatus } from '../enums/job-status.enum';
import { Pipeline } from '../../pipelines/entities/pipeline.entity';
import { EmploymentType } from '../enums/employment-type.enum';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ type: 'text' }) description: string;
  @Column({ nullable: true }) department?: string;
  @Column({ nullable: true }) location?: string;
  @Column({ type: 'enum', enum: EmploymentType, nullable: true })
  employmentType?: EmploymentType;
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;
  @ManyToOne(() => User, { eager: true, nullable: false }) owner: User;
  @ManyToOne(() => Pipeline, { eager: true, nullable: false })
  pipeline: Pipeline;
  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @Column({ type: 'timestamp', nullable: true }) publishedAt?: Date;
  @Column({ type: 'timestamp', nullable: true }) closedAt?: Date;
  @Column({ type: 'timestamp', nullable: true }) reopenedAt?: Date;
  @VersionColumn() version: number;
}
