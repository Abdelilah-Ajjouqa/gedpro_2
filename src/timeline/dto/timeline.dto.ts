import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TimelineEventVisibility } from '../entities/timeline-event.entity';

export class TimelineQueryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({
    description: 'Opaque cursor returned by the preceding page',
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}

export class CreateTimelineNoteDto {
  @ApiProperty({ example: 'Candidate prefers afternoon interviews.' })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    enum: TimelineEventVisibility,
    default: TimelineEventVisibility.INTERNAL,
  })
  @IsEnum(TimelineEventVisibility)
  @IsOptional()
  visibility = TimelineEventVisibility.INTERNAL;

  @ApiPropertyOptional({
    description: 'Small structured attributes such as mention user IDs',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
