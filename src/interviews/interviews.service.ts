import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { User } from '../users/entities/user.entity';
import { InterviewStatus } from './enums/interview-status.enum';

@Injectable()
export class InterviewsService {
    constructor(
        @InjectRepository(Interview)
        private interviewRepository: Repository<Interview>,
    ) { }

    async create(createInterviewDto: CreateInterviewDto, interviewer: User) {
        // Basic conflict check (omitted for brevity, can be added later)

        const attendees = createInterviewDto.attendees
            ? createInterviewDto.attendees.map(id => ({ id } as User))
            : [];

        const interview = this.interviewRepository.create({
            ...createInterviewDto,
            candidate: { id: createInterviewDto.candidateId },
            interviewer: interviewer, // The user creating it is the primary interviewer
            attendees: attendees,
        });

        return await this.interviewRepository.save(interview);
    }

    async findAll() {
        return await this.interviewRepository.find({
            order: { date: 'ASC' },
        });
    }

    async findOne(id: number) {
        const interview = await this.interviewRepository.findOne({
            where: { id },
            relations: ['candidate', 'interviewer', 'attendees'],
        });
        if (!interview) {
            throw new NotFoundException(`Interview with ID ${id} not found`);
        }
        return interview;
    }

    async cancel(id: number) {
        const interview = await this.findOne(id);
        interview.status = InterviewStatus.CANCELLED;
        return await this.interviewRepository.save(interview);
    }
}
