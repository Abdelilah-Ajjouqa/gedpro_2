import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TimelineEventVisibility {
  INTERNAL = 'internal',
  CANDIDATE = 'candidate',
}

export enum TimelineTargetType {
  CANDIDATE = 'candidate',
  APPLICATION = 'application',
}

@Entity('timeline_events')
@Index(['candidateId', 'createdAt', 'id'])
@Index(['applicationId', 'createdAt', 'id'])
export class TimelineEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() type: string;
  @Column({ type: 'integer', nullable: true }) actorId: number | null;
  @Column({ type: 'varchar', nullable: true }) actorName: string | null;
  @Column({
    type: 'enum',
    enum: TimelineEventVisibility,
    default: TimelineEventVisibility.INTERNAL,
  })
  visibility: TimelineEventVisibility;
  @Column({ type: 'enum', enum: TimelineTargetType })
  targetType: TimelineTargetType;
  @Column({ type: 'integer' }) targetId: number;
  @Column({ type: 'integer' }) candidateId: number;
  @Column({ type: 'integer', nullable: true }) applicationId: number | null;
  @Column({ type: 'varchar', nullable: true }) sourceType: string | null;
  @Column({ type: 'varchar', nullable: true }) sourceId: string | null;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
