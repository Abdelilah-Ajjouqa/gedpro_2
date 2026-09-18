import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PipelineStage } from './pipeline-stage.entity';
@Entity('pipeline_transitions')
@Unique(['fromStage', 'toStage'])
export class PipelineTransition {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => PipelineStage, (stage) => stage.outgoingTransitions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  fromStage: PipelineStage;
  @ManyToOne(() => PipelineStage, { nullable: false, onDelete: 'CASCADE' })
  toStage: PipelineStage;
}
