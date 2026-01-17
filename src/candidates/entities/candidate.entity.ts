import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { CandidateState } from '../enums/candidate-state.enum';
import { CandidateHistory } from './candidate-history.entity';

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

    @Column({ nullable: true })
    phone: string;

    @Column({
        type: 'enum',
        enum: CandidateState,
        default: CandidateState.NEW
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
}
