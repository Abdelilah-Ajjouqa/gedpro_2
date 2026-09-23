import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { User } from '../../users/entities/user.entity';
import { InterviewStatus } from '../enums/interview-status.enum';
import { InterviewType } from '../enums/interview-type.enum';
import { Scorecard } from './scorecard.entity';

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn() id: number;
  @VersionColumn() version: number;
  @Column({ type: 'timestamptz' }) date: Date;
  @Column({ default: 60 }) duration: number;
  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;
  @Column({ type: 'enum', enum: InterviewType, default: InterviewType.HR })
  type: InterviewType;
  @Column({ default: 1 }) round: number;
  @Column({ type: 'varchar', nullable: true }) title: string | null;
  @Column({ type: 'varchar', nullable: true }) location: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'varchar', default: 'UTC' }) timezone: string;
  @Column({ type: 'text', nullable: true }) outcomeReason: string | null;
  @Column({ type: 'timestamptz', nullable: true })
  feedbackDeadline: Date | null;
  @Column({ default: false }) hideFeedbackUntilComplete: boolean;
  @Column({ type: 'varchar', nullable: true }) calendarProvider: string | null;
  @Column({ type: 'varchar', nullable: true }) calendarEventId: string | null;
  @Column({ default: 'not_requested' }) calendarSyncStatus: string;
  @Column({ type: 'text', nullable: true }) calendarSyncError: string | null;
  @ManyToOne(() => Candidate, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  candidate: Candidate;
  @ManyToOne(() => Application, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  application: Application | null;
  @ManyToOne(() => User, { eager: true, nullable: false }) interviewer: User;
  @ManyToMany(() => User, { eager: true }) @JoinTable() attendees: User[];
  @OneToMany(() => Scorecard, (scorecard) => scorecard.interview)
  scorecards: Scorecard[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
