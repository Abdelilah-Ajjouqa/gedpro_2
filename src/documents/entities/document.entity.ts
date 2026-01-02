import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity'; 

@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    originalName: string; 

    @Column()
    filename: string; 

    @Column()
    mimeType: string; 

    @Column()
    size: number; 

    @Column()
    path: string; 

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}