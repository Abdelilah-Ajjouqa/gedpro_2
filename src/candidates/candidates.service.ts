import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateHistory } from './entities/candidate-history.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CandidateState } from './enums/candidate-state.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CandidatesService {
    constructor(
        @InjectRepository(Candidate)
        private candidateRepository: Repository<Candidate>,
        @InjectRepository(CandidateHistory)
        private historyRepository: Repository<CandidateHistory>,
        private dataSource: DataSource,
    ) { }

    async create(createCandidateDto: CreateCandidateDto) {
        const candidate = this.candidateRepository.create(createCandidateDto);
        return await this.candidateRepository.save(candidate);
    }

    async findAll() {
        return await this.candidateRepository.find();
    }

    async findOne(id: number) {
        const candidate = await this.candidateRepository.findOne({
            where: { id },
            relations: ['history', 'history.changedBy']
        });
        if (!candidate) {
            throw new NotFoundException(`Candidate with ID ${id} not found`);
        }
        return candidate;
    }

    async updateState(id: number, newState: CandidateState, user: User, comment?: string) {
        // Use a transaction to ensure both Candidate update and History creation succeed or fail together
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const candidate = await queryRunner.manager.findOne(Candidate, { where: { id } });
            if (!candidate) {
                throw new NotFoundException(`Candidate with ID ${id} not found`);
            }

            const previousState = candidate.currentState;
            candidate.currentState = newState;
            await queryRunner.manager.save(candidate);

            const history = queryRunner.manager.create(CandidateHistory, {
                candidate,
                previousState,
                newState,
                comment,
                changedBy: user,
            });
            await queryRunner.manager.save(history);

            await queryRunner.commitTransaction();
            return candidate;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
