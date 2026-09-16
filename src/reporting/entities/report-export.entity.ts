import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}
export enum ReportExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Entity('report_exports')
export class ReportExport {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User, { eager: true, nullable: false, onDelete: 'CASCADE' })
  requestedBy: User;
  @Column({ type: 'enum', enum: ReportExportFormat })
  format: ReportExportFormat;
  @Column({
    type: 'enum',
    enum: ReportExportStatus,
    default: ReportExportStatus.PENDING,
  })
  status: ReportExportStatus;
  @Column({ type: 'jsonb', default: {} }) filters: Record<string, unknown>;
  @Column({ type: 'varchar', nullable: true }) objectKey: string | null;
  @Column({ type: 'bigint', nullable: true }) size: number | null;
  @Column({ type: 'text', nullable: true }) error: string | null;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;
}
