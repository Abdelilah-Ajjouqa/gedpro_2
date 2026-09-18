import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { AuthModule } from '../auth/auth.module';
import {
  DocumentsController,
  PublicDocumentDownloadController,
} from './documents.controller';
import { DocumentsService } from './documents.service';
import { TimelineModule } from '../timeline/timeline.module';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Application } from '../applications/entities/application.entity';
import { DocumentSecurityService } from './security/document-security';
import {
  DOCUMENT_STORAGE,
  documentStorageFactory,
} from './storage/document-storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Candidate, Application]),
    AuthModule,
    TimelineModule,
  ],
  controllers: [DocumentsController, PublicDocumentDownloadController],
  providers: [
    DocumentsService,
    DocumentSecurityService,
    { provide: DOCUMENT_STORAGE, useFactory: documentStorageFactory },
  ],
})
export class DocumentsModule {}
