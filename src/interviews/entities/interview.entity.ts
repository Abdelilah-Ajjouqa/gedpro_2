import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { InterviewStatus } from '../enums/interview-status.enum';
import { InterviewType } from '../enums/interview-type.enum';

@Entity('interviews')
export class Interview {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    date: Date;

    @Column({ default: 60 })
    duration: number; // in minutes

    @Column({
        type: 'enum',
        enum: InterviewStatus,
        default: InterviewStatus.SCHEDULED,
    })
    status: InterviewStatus;

    @Column({
        type: 'enum',
        enum: InterviewType,
        default: InterviewType.HR,
    })
    type: InterviewType;

    @Column({ nullable: true })
    location: string; // Physical location or Meeting Link

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => Candidate, { eager: true, onDelete: 'CASCADE' })
    candidate: Candidate;

    @ManyToOne(() => User, { eager: true })
    interviewer: User;

    @ManyToMany(() => User)
    @JoinTable()
    attendees: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
