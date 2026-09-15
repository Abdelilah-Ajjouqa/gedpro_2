import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PipelineStage } from './pipeline-stage.entity';
@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) name: string;
  @Column({ nullable: true }) description?: string;
  @Column({ default: true }) isTemplate: boolean;
  @Column({ default: false }) archived: boolean;
  @OneToMany(() => PipelineStage, stage => stage.pipeline, { cascade: true }) stages: PipelineStage[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
