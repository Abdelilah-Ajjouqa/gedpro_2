import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidate } from './entities/candidate.entity';
import { CandidateHistory } from './entities/candidate-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, CandidateHistory]),
  ],
  providers: [CandidatesService],
  controllers: [CandidatesController]
})
export class CandidatesModule { }
