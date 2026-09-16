import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Document } from '../documents/entities/document.entity';
import { Job } from '../jobs/entities/job.entity';
import { TimelineEvent } from '../timeline/entities/timeline-event.entity';
import { AiController } from './ai.controller';
import { LocalAdvisoryAiProvider } from './ai-provider';
import { AiService } from './ai.service';
import { AiFeedback } from './entities/ai-feedback.entity';
import { AiGeneration } from './entities/ai-generation.entity';
import { CvExtraction } from './entities/cv-extraction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiGeneration,
      AiFeedback,
      CvExtraction,
      Candidate,
      Job,
      Application,
      Document,
      TimelineEvent,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, LocalAdvisoryAiProvider],
  exports: [AiService],
})
export class AiModule {}
