import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
export class SubmitResponseDto {
  @IsNotEmpty() @IsObject() answers: Record<string, unknown>;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) candidateId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) applicationId?: number;
}
export class AssignFormDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) jobId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) applicationId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) stageId?: number;
}
export class ListResponsesDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) candidateId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) applicationId?: number;
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  reviewStatus?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
export class ReviewResponseDto {
  @IsEnum(['approved', 'rejected']) status: string;
  @IsOptional() @IsString() notes?: string;
}
