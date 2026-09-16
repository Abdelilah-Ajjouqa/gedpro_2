import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid') id: string;
  @OneToOne(() => Candidate, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  candidate: Candidate;
  @Column({ default: true }) applicationUpdates: boolean;
  @Column({ default: true }) interviewUpdates: boolean;
  @Column({ default: true }) outcomeUpdates: boolean;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
