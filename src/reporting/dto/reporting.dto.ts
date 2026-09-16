import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ReportExportFormat } from '../entities/report-export.entity';

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Inclusive UTC boundary' })
  @IsOptional()
  @IsDateString()
  from?: string;
  @ApiPropertyOptional({ description: 'Exclusive UTC boundary' })
  @IsOptional()
  @IsDateString()
  to?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  jobId?: number;
}
export class CreateReportExportDto extends ReportQueryDto {
  @IsEnum(ReportExportFormat) format: ReportExportFormat;
}
