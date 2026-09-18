import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PipelineStage } from '../../pipelines/entities/pipeline-stage.entity';
import { Application } from './application.entity';

@Entity('application_history')
export class ApplicationHistory {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Application, (application) => application.history, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  application: Application;
  @ManyToOne(() => PipelineStage, {
    eager: true,
    nullable: true,
    onDelete: 'RESTRICT',
  })
  previousStage?: PipelineStage;
  @ManyToOne(() => PipelineStage, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  newStage: PipelineStage;
  @Column({ nullable: true }) comment?: string;
  @ManyToOne(() => User, { eager: true, nullable: false }) changedBy: User;
  @CreateDateColumn() changedAt: Date;
}
