import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidate } from './entities/candidate.entity';
import { CandidateHistory } from './entities/candidate-history.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { FormResponse, FormResponseSchema } from '../forms/schemas/form-response.schema';
import { SecurityAuditEvent } from '../auth/entities/security-audit-event.entity';
import { SecurityAuditService } from '../auth/security-audit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, CandidateHistory, SecurityAuditEvent]),
    MongooseModule.forFeature([{name:FormResponse.name,schema:FormResponseSchema}]),
  ],
  providers: [CandidatesService, SecurityAuditService],
  controllers: [CandidatesController]
})
export class CandidatesModule { }
