import {
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EmploymentType } from '../enums/employment-type.enum';

export class CreateJobDto {
  @IsInt() pipelineId: number;
  @IsString() @IsNotEmpty() @MaxLength(160) title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsString() @MaxLength(120) department?: string;
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
}

export class UpdateJobDto {
  @IsOptional() @IsInt() pipelineId?: number;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() description?: string;
  @IsOptional() @IsString() @MaxLength(120) department?: string;
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
}
