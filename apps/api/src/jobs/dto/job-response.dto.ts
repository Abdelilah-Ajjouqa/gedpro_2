import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '../enums/employment-type.enum';
import { JobStatus } from '../enums/job-status.enum';

export class JobOwnerDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
}
export class JobPipelineRefDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
}
export class JobResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional({ nullable: true }) department?: string;
  @ApiPropertyOptional({ nullable: true }) location?: string;
  @ApiPropertyOptional({ enum: EmploymentType, nullable: true })
  employmentType?: EmploymentType;
  @ApiProperty({ enum: JobStatus }) status: JobStatus;
  @ApiProperty({ type: JobOwnerDto }) owner: JobOwnerDto;
  @ApiProperty({ type: JobPipelineRefDto }) pipeline: JobPipelineRefDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({ nullable: true }) publishedAt?: Date;
  @ApiPropertyOptional({ nullable: true }) closedAt?: Date;
  @ApiPropertyOptional({ nullable: true }) reopenedAt?: Date;
  @ApiProperty() version: number;
  @ApiProperty({ type: [String] }) allowedActions: string[];
}
export class JobListResponseDto {
  @ApiProperty({ type: [JobResponseDto] }) data: JobResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
