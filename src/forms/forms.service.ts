import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form, FormDocument } from './schemas/form.schema';
import {
  FormResponse,
  FormResponseDocument,
} from './schemas/form-response.schema';
import { CreateFormDto } from './dto/create-form.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { User } from '../users/entities/user.entity';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import { TimelineService } from '../timeline/timeline.service';

@Injectable()
export class FormsService {
  constructor(
    @InjectModel(Form.name) private formModel: Model<FormDocument>,
    @InjectModel(FormResponse.name)
    private responseModel: Model<FormResponseDocument>,
    private timeline: TimelineService,
  ) {}

  async createForm(createFormDto: CreateFormDto, user: User): Promise<Form> {
    const newForm = new this.formModel({
      ...createFormDto,
      createdBy: user.id,
    });
    return newForm.save();
  }

  async findAll(): Promise<Form[]> {
    return this.formModel.find().exec();
  }

  async findOne(id: string): Promise<Form> {
    const form = await this.formModel.findById(id).exec();
    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }
    return form;
  }

  async submitResponse(
    formId: string,
    submitResponseDto: SubmitResponseDto,
    user?: User,
  ): Promise<FormResponse> {
    // Verify form exists
    await this.findOne(formId);

    const newResponse = new this.responseModel({
      formId,
      answers: submitResponseDto.answers,
      candidateId: submitResponseDto.candidateId,
      submittedBy: user ? user.id : undefined,
    });

    const saved = await newResponse.save();
    if (submitResponseDto.candidateId)
      await this.timeline.record({
        type: 'form.response_submitted',
        actor: user,
        visibility: TimelineEventVisibility.CANDIDATE,
        candidateId: submitResponseDto.candidateId,
        targetType: TimelineTargetType.CANDIDATE,
        targetId: submitResponseDto.candidateId,
        sourceType: 'form_response',
        sourceId: saved._id.toString(),
        metadata: { formId },
      });
    return saved;
  }

  async getResponses(formId: string): Promise<FormResponse[]> {
    return this.responseModel.find({ formId }).exec();
  }
}
