import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApplicationStage } from '../enums/application-stage.enum';

export class CreateApplicationDto {
  @IsInt() candidateId: number;
  @IsInt() jobId: number;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsInt() ownerId?: number;
}
export class TransitionApplicationDto {
  @IsEnum(ApplicationStage) stage: ApplicationStage;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() @IsNotEmpty() rejectionReason?: string;
}
export class ListApplicationsDto {
  @IsOptional() @Type(() => Number) @IsInt() jobId?: number;
  @IsOptional() @Type(() => Number) @IsInt() candidateId?: number;
  @IsOptional() @IsEnum(ApplicationStage) stage?: ApplicationStage;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
