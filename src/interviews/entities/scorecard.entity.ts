import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ScorecardRecommendation } from '../enums/scorecard-recommendation.enum';
import { Interview } from './interview.entity';
import { ScorecardTemplate } from './scorecard-template.entity';

@Entity('scorecards')
@Unique(['interview', 'reviewer'])
export class Scorecard {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Interview, (interview) => interview.scorecards, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  interview: Interview;
  @ManyToOne(() => User, { eager: true, nullable: false }) reviewer: User;
  @ManyToOne(() => ScorecardTemplate, { eager: true, nullable: false })
  template: ScorecardTemplate;
  @Column({ type: 'jsonb', nullable: true }) ratings: Record<
    string,
    number
  > | null;
  @Column({ type: 'enum', enum: ScorecardRecommendation, nullable: true })
  recommendation: ScorecardRecommendation | null;
  @Column({ type: 'text', nullable: true }) privateNotes: string | null;
  @Column({ type: 'timestamptz', nullable: true }) submittedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
