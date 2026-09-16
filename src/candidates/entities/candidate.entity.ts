import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  VersionColumn,
} from 'typeorm';
import { CandidateState } from '../enums/candidate-state.enum';
import { CandidateHistory } from './candidate-history.entity';
import { User } from '../../users/entities/user.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;
  @Column() normalizedEmail: string;

  @Column({ nullable: true })
  phone: string;
  @Column({ nullable: true }) normalizedPhone?: string;
  @Column({ type: 'text', array: true, default: '{}' }) tags: string[];
  @Column({ type: 'text', array: true, default: '{}' }) skills: string[];
  @Column({ nullable: true }) source?: string;
  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  owner?: User;
  @Column({ type: 'timestamp', nullable: true }) archivedAt?: Date;
  @Column({ default: false }) privacyConsent: boolean;
  @Column({ type: 'timestamp', nullable: true }) consentAt?: Date;
  @Column({ type: 'timestamp', nullable: true }) retentionUntil?: Date;
  @Column({ type: 'timestamp', nullable: true }) deletionRequestedAt?: Date;
  @ManyToOne(() => Candidate, { nullable: true, onDelete: 'SET NULL' })
  mergedInto?: Candidate;

  @Column({
    type: 'enum',
    enum: CandidateState,
    default: CandidateState.NEW,
  })
  currentState: CandidateState;

  @OneToMany(() => CandidateHistory, (history) => history.candidate)
  history: CandidateHistory[];

  // Placeholder for documents relation (will be added later)
  // @OneToMany(() => Document, (document) => document.candidate)
  // files: Document[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @VersionColumn() version: number;
}
