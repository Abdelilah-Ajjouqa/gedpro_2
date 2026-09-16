import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form, FormSchema } from './schemas/form.schema';
import {
  FormAssignment,
  FormAssignmentSchema,
  FormResponse,
  FormResponseSchema,
} from './schemas/form-response.schema';
import { TimelineModule } from '../timeline/timeline.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Application } from '../applications/entities/application.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { Document } from '../documents/entities/document.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Form.name, schema: FormSchema },
      { name: FormResponse.name, schema: FormResponseSchema },
      { name: FormAssignment.name, schema: FormAssignmentSchema },
    ]),
    TypeOrmModule.forFeature([
      Candidate,
      Application,
      Job,
      PipelineStage,
      Document,
    ]),
    TimelineModule,
  ],
  providers: [FormsService],
  controllers: [FormsController],
})
export class FormsModule {}
