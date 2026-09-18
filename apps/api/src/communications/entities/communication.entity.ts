import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Interview } from '../../interviews/entities/interview.entity';
import { User } from '../../users/entities/user.entity';
import { EmailTemplate } from './email-template.entity';

export enum CommunicationType {
  APPLICATION_ACKNOWLEDGEMENT = 'application_acknowledgement',
  INTERVIEW_INVITATION = 'interview_invitation',
  INTERVIEW_REMINDER = 'interview_reminder',
  REJECTION = 'rejection',
  OFFER = 'offer',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  CUSTOM = 'custom',
}
export enum DeliveryStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  DEAD_LETTER = 'dead_letter',
  BOUNCED = 'bounced',
}

@Entity('communications')
export class Communication {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: CommunicationType }) type: CommunicationType;
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.QUEUED,
  })
  status: DeliveryStatus;
  @Column() recipient: string;
  @Column() subject: string;
  @Column({ type: 'text', select: false }) htmlBody: string;
  @Index({ unique: true }) @Column() idempotencyKey: string;
  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  providerMessageId: string | null;
  @Column({ default: 'log' }) provider: string;
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ type: 'text', nullable: true }) lastError: string | null;
  @Column({ type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) deliveredAt: Date | null;
  @ManyToOne(() => EmailTemplate, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  template: EmailTemplate | null;
  @ManyToOne(() => Candidate, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  candidate: Candidate | null;
  @ManyToOne(() => Application, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  application: Application | null;
  @ManyToOne(() => Interview, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  interview: Interview | null;
  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  createdBy: User | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
