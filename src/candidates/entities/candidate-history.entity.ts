import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { CandidateState } from '../enums/candidate-state.enum';
import { Candidate } from './candidate.entity';
import { User } from '../../users/entities/user.entity';

@Entity('candidate_history')
export class CandidateHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Candidate, (candidate) => candidate.history, { onDelete: 'CASCADE' })
    candidate: Candidate;

    @Column({
        type: 'enum',
        enum: CandidateState,
    })
    previousState: CandidateState;

    @Column({
        type: 'enum',
        enum: CandidateState,
    })
    newState: CandidateState;

    @Column({ nullable: true })
    comment: string;

    @ManyToOne(() => User, { nullable: true })
    changedBy: User;

    @CreateDateColumn()
    changedAt: Date;
}
