import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DocumentCategory } from '../entities/document.entity';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    description: 'Candidate whose journey should include this document',
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  candidateId?: number;
  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  applicationId?: number;
  @ApiPropertyOptional({
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  @IsEnum(DocumentCategory)
  @IsOptional()
  category: DocumentCategory = DocumentCategory.OTHER;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  retentionUntil?: Date;
}

export class ReplaceDocumentDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  retentionUntil?: Date;
}
