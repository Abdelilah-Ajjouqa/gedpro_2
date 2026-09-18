import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ExtractCvDto {
  @ApiProperty() @IsInt() candidateId: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() documentId?: number;
  @ApiProperty({
    description:
      'Plain text obtained from the CV; the original document remains unchanged.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  text: string;
}
export class CorrectExtractionDto {
  @ApiProperty() @IsObject() corrected: Record<string, unknown>;
}
export class AiSearchDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) query: string;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class MatchJobDto {
  @ApiProperty() @IsInt() jobId: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() candidateId?: number;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class SuggestQuestionsDto {
  @ApiProperty() @IsInt() jobId: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() candidateId?: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];
  @ApiPropertyOptional({ default: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count = 6;
}
export class FeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
  @ApiPropertyOptional({
    description:
      'Human correction or decision that supersedes the advisory output.',
  })
  @IsOptional()
  @IsObject()
  override?: Record<string, unknown>;
}
export class MonitoringQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(String(value)) : undefined))
  @IsDate()
  from?: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(String(value)) : undefined))
  @IsDate()
  to?: Date;
}
