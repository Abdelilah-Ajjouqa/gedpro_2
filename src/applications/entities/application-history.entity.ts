import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApplicationStage } from '../enums/application-stage.enum';
import { Application } from './application.entity';

@Entity('application_history')
export class ApplicationHistory {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Application, (application) => application.history, { nullable: false, onDelete: 'CASCADE' }) application: Application;
  @Column({ type: 'enum', enum: ApplicationStage, nullable: true }) previousStage?: ApplicationStage;
  @Column({ type: 'enum', enum: ApplicationStage }) newStage: ApplicationStage;
  @Column({ nullable: true }) comment?: string;
  @ManyToOne(() => User, { eager: true, nullable: false }) changedBy: User;
  @CreateDateColumn() changedAt: Date;
}
