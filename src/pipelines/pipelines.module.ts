import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pipeline } from './entities/pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { PipelineTransition } from './entities/pipeline-transition.entity';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Pipeline, PipelineStage, PipelineTransition]),
  ],
  controllers: [PipelinesController],
  providers: [PipelinesService],
  exports: [PipelinesService],
})
export class PipelinesModule {}
