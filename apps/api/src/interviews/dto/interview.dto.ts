import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewType } from '../enums/interview-type.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { ScorecardRecommendation } from '../enums/scorecard-recommendation.enum';

export class CreateInterviewDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) candidateId: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) applicationId: number;
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional()
  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;
  @ApiPropertyOptional({ default: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  @IsOptional()
  duration?: number;
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  round?: number;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  @IsOptional()
  location?: string;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  notes?: string;
  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsOptional()
  interviewerIds?: number[];
  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsOptional()
  attendeeIds?: number[];
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  scorecardTemplateId?: number;
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  feedbackDeadline?: string;
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hideFeedbackUntilComplete?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() calendarProvider?: string;
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  overrideConflicts?: boolean;
  @ApiPropertyOptional({ default: 'UTC' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  timezone?: string;
}
export class RescheduleInterviewDto {
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  @IsOptional()
  duration?: number;
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  overrideConflicts?: boolean;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  timezone?: string;
}

export class ListInterviewsDto {
  @ApiPropertyOptional() @IsDateString() @IsOptional() from?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() to?: string;
  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;
  @ApiPropertyOptional({ enum: InterviewType })
  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  jobId?: number;
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  applicationId?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() interviewerId?: string;
  @ApiPropertyOptional({ enum: ['pending', 'submitted', 'overdue', 'all'] })
  @IsIn(['pending', 'submitted', 'overdue', 'all'])
  @IsOptional()
  feedback?: string;
  @ApiPropertyOptional({ enum: ['date', 'updatedAt'], default: 'date' })
  @IsIn(['date', 'updatedAt'])
  @IsOptional()
  sort?: 'date' | 'updatedAt';
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  direction?: 'asc' | 'desc';
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;
  @ApiPropertyOptional({ enum: [5, 10, 20, 50], default: 20 })
  @Type(() => Number)
  @IsInt()
  @IsIn([5, 10, 20, 50])
  @IsOptional()
  limit?: number;
}
export class InterviewOutcomeDto {
  @ApiProperty({
    enum: [
      InterviewStatus.COMPLETED,
      InterviewStatus.CANCELLED,
      InterviewStatus.NO_SHOW,
    ],
  })
  @IsEnum(InterviewStatus)
  status: InterviewStatus;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  reason?: string;
}
export class ScorecardCriterionDto {
  @IsString() @MaxLength(80) key: string;
  @IsString() @MaxLength(200) label: string;
  @IsString() @MaxLength(1000) @IsOptional() description?: string;
  @Type(() => Number) @IsInt() minRating: number;
  @Type(() => Number) @IsInt() maxRating: number;
  @IsBoolean() @IsOptional() required?: boolean;
}
export class CreateScorecardTemplateDto {
  @ApiProperty() @IsString() @MaxLength(200) name: string;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;
  @ApiProperty({ type: [ScorecardCriterionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScorecardCriterionDto)
  criteria: ScorecardCriterionDto[];
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  jobId?: number;
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  stageId?: number;
}
export class SubmitScorecardDto {
  @ApiProperty() @IsObject() ratings: Record<string, number>;
  @ApiProperty({ enum: ScorecardRecommendation })
  @IsEnum(ScorecardRecommendation)
  recommendation: ScorecardRecommendation;
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(10000)
  @IsOptional()
  privateNotes?: string;
}
