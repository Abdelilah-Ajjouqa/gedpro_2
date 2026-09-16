import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('email_templates')
@Unique(['key', 'version'])
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column() key: string;
  @Column() name: string;
  @Column() subject: string;
  @Column({ type: 'text' }) htmlBody: string;
  @Column({ type: 'integer' }) version: number;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
