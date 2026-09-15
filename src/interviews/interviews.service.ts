import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { User } from '../users/entities/user.entity';
import { InterviewStatus } from './enums/interview-status.enum';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private interviewRepository: Repository<Interview>,
    private timeline: TimelineService,
  ) {}

  async create(createInterviewDto: CreateInterviewDto, interviewer: User) {
    // Basic conflict check (omitted for brevity, can be added later)

    const attendees = createInterviewDto.attendees
      ? createInterviewDto.attendees.map((id) => ({ id }) as User)
      : [];

    const interview = this.interviewRepository.create({
      ...createInterviewDto,
      candidate: { id: createInterviewDto.candidateId },
      interviewer: interviewer, // The user creating it is the primary interviewer
      attendees: attendees,
    });

    const saved = await this.interviewRepository.save(interview);
    await this.timeline.record({
      type: 'interview.scheduled',
      actor: interviewer,
      visibility: TimelineEventVisibility.CANDIDATE,
      candidateId: createInterviewDto.candidateId,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: createInterviewDto.candidateId,
      sourceType: 'interview',
      sourceId: saved.id,
      metadata: {
        interviewId: saved.id,
        date: saved.date,
        duration: saved.duration,
        interviewType: saved.type,
      },
    });
    return saved;
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

  async cancel(id: number, actor?: User) {
    const interview = await this.findOne(id);
    interview.status = InterviewStatus.CANCELLED;
    const saved = await this.interviewRepository.save(interview);
    await this.timeline.record({
      type: 'interview.cancelled',
      actor,
      visibility: TimelineEventVisibility.CANDIDATE,
      candidateId: interview.candidate.id,
      targetType: TimelineTargetType.CANDIDATE,
      targetId: interview.candidate.id,
      sourceType: 'interview',
      sourceId: id,
      metadata: { interviewId: id },
    });
    return saved;
  }
}
