import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackgroundJob } from '../communications/entities/background-job.entity';
import { ReportExport } from './entities/report-export.entity';
import { ReportExportWorkerService } from './report-export-worker.service';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
@Module({
  imports: [TypeOrmModule.forFeature([ReportExport, BackgroundJob])],
  controllers: [ReportingController],
  providers: [ReportingService, ReportExportWorkerService],
})
export class ReportingModule {}
