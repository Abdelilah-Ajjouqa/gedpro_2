import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AiGeneration } from './ai-generation.entity';

@Entity('ai_feedback')
@Unique(['generation', 'reviewer'])
export class AiFeedback {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => AiGeneration, { nullable: false, onDelete: 'CASCADE' })
  generation: AiGeneration;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  reviewer?: User | null;
  @Column({ type: 'smallint' }) rating: number;
  @Column({ type: 'text', nullable: true }) comment?: string | null;
  @Column({ type: 'jsonb', nullable: true }) override?: Record<
    string,
    unknown
  > | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
