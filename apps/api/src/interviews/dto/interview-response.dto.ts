import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewStatus } from '../enums/interview-status.enum';
import { InterviewType } from '../enums/interview-type.enum';

export class InterviewPersonDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
}
export class InterviewJobRefDto {
  @ApiProperty() id: number;
  @ApiProperty() title: string;
}
export class InterviewApplicationRefDto {
  @ApiProperty() id: number;
}
export class InterviewFeedbackCountDto {
  @ApiProperty() total: number;
  @ApiProperty() submitted: number;
}
export class ScorecardCriterionResponseDto {
  @ApiProperty() key: string;
  @ApiProperty() label: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() minRating: number;
  @ApiProperty() maxRating: number;
  @ApiProperty() required: boolean;
}
export class ScorecardTemplateResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty({ type: [ScorecardCriterionResponseDto] })
  criteria: ScorecardCriterionResponseDto[];
  @ApiProperty() archived: boolean;
}
export class ScorecardAssignmentResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() version: number;
  @ApiProperty({ type: InterviewPersonDto }) reviewer: InterviewPersonDto;
  @ApiProperty({ type: ScorecardTemplateResponseDto })
  template: ScorecardTemplateResponseDto;
  @ApiPropertyOptional() submittedAt?: Date | null;
  @ApiProperty() state: string;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'integer' },
  })
  ratings?: Record<string, number> | null;
  @ApiPropertyOptional() recommendation?: string | null;
  @ApiPropertyOptional() privateNotes?: string | null;
  @ApiProperty({ type: [String] }) allowedActions: string[];
}
export class InterviewListItemDto {
  @ApiProperty() id: number;
  @ApiProperty() version: number;
  @ApiProperty() date: Date;
  @ApiProperty() duration: number;
  @ApiProperty() timezone: string;
  @ApiProperty({ enum: InterviewStatus }) status: InterviewStatus;
  @ApiProperty({ enum: InterviewType }) type: InterviewType;
  @ApiProperty() round: number;
  @ApiPropertyOptional() title?: string | null;
  @ApiPropertyOptional() location?: string | null;
  @ApiProperty({ type: InterviewPersonDto }) candidate: InterviewPersonDto;
  @ApiPropertyOptional({ type: InterviewApplicationRefDto })
  application?: InterviewApplicationRefDto | null;
  @ApiPropertyOptional({ type: InterviewJobRefDto })
  job?: InterviewJobRefDto | null;
  @ApiProperty({ type: InterviewPersonDto })
  leadInterviewer: InterviewPersonDto;
  @ApiProperty() participantCount: number;
  @ApiProperty({ type: InterviewFeedbackCountDto })
  feedback: InterviewFeedbackCountDto;
  @ApiProperty() syncStatus: string;
  @ApiProperty({ type: [String] }) allowedActions: string[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
export class InterviewDetailDto extends InterviewListItemDto {
  @ApiPropertyOptional() notes?: string | null;
  @ApiPropertyOptional() outcomeReason?: string | null;
  @ApiPropertyOptional() feedbackDeadline?: Date | null;
  @ApiProperty() hideFeedbackUntilComplete: boolean;
  @ApiProperty({ type: [InterviewPersonDto] }) attendees: InterviewPersonDto[];
  @ApiProperty({ type: [ScorecardAssignmentResponseDto] })
  scorecards: ScorecardAssignmentResponseDto[];
}
export class InterviewListResponseDto {
  @ApiProperty({ type: [InterviewListItemDto] }) data: InterviewListItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
export class MissingFeedbackResponseDto {
  @ApiProperty() scorecardId: number;
  @ApiProperty() interviewId: number;
  @ApiProperty({ type: InterviewPersonDto }) reviewer: InterviewPersonDto;
  @ApiPropertyOptional() deadline?: Date | null;
  @ApiProperty() overdue: boolean;
}
export class DecisionSummaryResponseDto {
  @ApiProperty() applicationId: number;
  @ApiProperty() complete: number;
  @ApiProperty({ type: [MissingFeedbackResponseDto] })
  missing: MissingFeedbackResponseDto[];
  @ApiProperty({ type: [ScorecardAssignmentResponseDto] })
  scorecards: ScorecardAssignmentResponseDto[];
}
