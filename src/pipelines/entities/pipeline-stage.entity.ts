import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Pipeline } from './pipeline.entity';
import { StageCategory } from '../enums/stage-category.enum';
import { PipelineTransition } from './pipeline-transition.entity';
@Entity('pipeline_stages') @Unique(['pipeline','position'])
export class PipelineStage {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Pipeline, pipeline => pipeline.stages, { nullable: false, onDelete: 'CASCADE' }) pipeline: Pipeline;
  @Column() name: string;
  @Column({ type: 'enum', enum: StageCategory }) category: StageCategory;
  @Column() position: number;
  @Column({ default: false }) archived: boolean;
  @OneToMany(() => PipelineTransition, transition => transition.fromStage) outgoingTransitions: PipelineTransition[];
}
