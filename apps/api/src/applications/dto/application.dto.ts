import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateApplicationDto {
  @IsInt() candidateId: number;
  @IsInt() jobId: number;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsInt() ownerId?: number;
}
export class TransitionApplicationDto {
  @IsInt() stageId: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() @IsNotEmpty() rejectionReason?: string;
}
export class ListApplicationsDto {
  @IsOptional() @Type(() => Number) @IsInt() jobId?: number;
  @IsOptional() @Type(() => Number) @IsInt() candidateId?: number;
  @IsOptional() @Type(() => Number) @IsInt() stageId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
export class BulkMoveItemDto {
  @IsInt() applicationId: number;
  @IsInt() stageId: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() @IsNotEmpty() rejectionReason?: string;
}
export class BulkMoveApplicationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkMoveItemDto)
  items: BulkMoveItemDto[];
}
