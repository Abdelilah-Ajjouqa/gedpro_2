import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  TimelineEventVisibility,
  TimelineTargetType,
} from '../entities/timeline-event.entity';

export const TIMELINE_NOTE_MAX_LENGTH = 2000;

export class TimelineQueryDto {
  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({
    type: String,
    description: 'Opaque cursor returned by the preceding page',
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}

export class CreateTimelineNoteDto {
  @ApiProperty({
    minLength: 1,
    maxLength: TIMELINE_NOTE_MAX_LENGTH,
    example: 'Candidate prefers afternoon interviews.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(TIMELINE_NOTE_MAX_LENGTH)
  text: string;
}

export class TimelineActorDto {
  @ApiProperty({ enum: ['user', 'candidate', 'system', 'former', 'unknown'] })
  kind: 'user' | 'candidate' | 'system' | 'former' | 'unknown';
  @ApiPropertyOptional({ nullable: true }) name: string | null;
}
export class TimelinePayloadDto {
  @ApiPropertyOptional({ nullable: true }) text: string | null;
  @ApiPropertyOptional({ nullable: true }) jobId: number | null;
  @ApiPropertyOptional({ nullable: true }) jobTitle: string | null;
  @ApiPropertyOptional({ nullable: true }) previousStageName: string | null;
  @ApiPropertyOptional({ nullable: true }) newStageName: string | null;
  @ApiPropertyOptional({ nullable: true }) comment: string | null;
  @ApiPropertyOptional({ nullable: true }) rejectionReason: string | null;
  @ApiPropertyOptional({ nullable: true }) summary: string | null;
}
export class TimelineEventDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() type: string;
  @ApiProperty({
    enum: [
      'system',
      'candidate',
      'application',
      'stage',
      'interview',
      'document',
      'form',
      'communication',
      'note',
    ],
  })
  category: string;
  @ApiProperty({
    format: 'date-time',
    description: 'Time the event was recorded',
  })
  occurredAt: string;
  @ApiProperty({ enum: TimelineEventVisibility })
  visibility: TimelineEventVisibility;
  @ApiProperty({ type: TimelineActorDto }) actor: TimelineActorDto;
  @ApiProperty() candidateId: number;
  @ApiPropertyOptional({ nullable: true }) applicationId: number | null;
  @ApiProperty({ enum: TimelineTargetType }) targetType: TimelineTargetType;
  @ApiProperty() targetId: number;
  @ApiProperty({ type: TimelinePayloadDto }) payload: TimelinePayloadDto;
}
export class TimelinePageDto {
  @ApiProperty({ type: [TimelineEventDto] }) data: TimelineEventDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor: string | null;
}
