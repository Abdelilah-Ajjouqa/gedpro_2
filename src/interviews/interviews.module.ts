import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { Interview } from './entities/interview.entity';
import { UsersModule } from '../users/users.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { TimelineModule } from '../timeline/timeline.module';
import { Scorecard } from './entities/scorecard.entity';
import { ScorecardTemplate } from './entities/scorecard-template.entity';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { User } from '../users/entities/user.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import {
  CALENDAR_PROVIDERS,
  InternalCalendarProvider,
} from './calendar/calendar-provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Interview,
      Scorecard,
      ScorecardTemplate,
      Application,
      Candidate,
      User,
      Job,
      PipelineStage,
    ]),
    UsersModule,
    CandidatesModule,
    TimelineModule,
  ],
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    {
      provide: CALENDAR_PROVIDERS,
      useFactory: () => [new InternalCalendarProvider()],
    },
  ],
})
export class InterviewsModule {}
