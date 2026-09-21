import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateApplicationDto {
  @IsInt() @Min(1) candidateId: number;
  @IsInt() @Min(1) jobId: number;
  @IsOptional() @IsString() @MaxLength(120) source?: string;
  @IsOptional() @IsInt() @Min(1) ownerId?: number;
}
export class TransitionApplicationDto {
  @IsInt() @Min(1) stageId: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason?: string;
}
export class ReopenApplicationDto {
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}
export class ListApplicationsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) jobId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) candidateId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) stageId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) ownerId?: number;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsString() stageCategory?: string;
  @IsOptional() @IsIn(['active', 'terminal', 'all']) terminal = 'all';
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'candidate', 'job', 'stage'])
  sort = 'createdAt';
  @IsOptional() @IsIn(['asc', 'desc']) direction = 'desc';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
export class BulkMoveItemDto {
  @IsInt() @Min(1) applicationId: number;
  @IsInt() @Min(1) version: number;
}
export class BulkMoveApplicationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BulkMoveItemDto)
  items: BulkMoveItemDto[];
  @IsInt() @Min(1) stageId: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason?: string;
}
