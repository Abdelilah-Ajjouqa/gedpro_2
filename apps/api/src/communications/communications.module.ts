import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { TimelineModule } from '../timeline/timeline.module';
import {
  CommunicationsController,
  CommunicationWebhookController,
} from './communications.controller';
import { CommunicationsService } from './communications.service';
import { EMAIL_PROVIDER, LogEmailProvider } from './email-provider';
import { BackgroundJob } from './entities/background-job.entity';
import { Communication } from './entities/communication.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { JobWorkerService } from './job-worker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailTemplate,
      Communication,
      BackgroundJob,
      NotificationPreference,
      Candidate,
      Application,
      Interview,
    ]),
    TimelineModule,
  ],
  controllers: [CommunicationsController, CommunicationWebhookController],
  providers: [
    CommunicationsService,
    JobWorkerService,
    { provide: EMAIL_PROVIDER, useClass: LogEmailProvider },
  ],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
