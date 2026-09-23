import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DocumentCategory, DocumentStatus } from '../entities/document.entity';

export enum DocumentSort {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  CATEGORY = 'category',
  STATUS = 'status',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListDocumentsDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  q?: string;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  candidateId?: number;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  applicationId?: number;
  @IsOptional() @IsEnum(DocumentCategory) category?: DocumentCategory;
  @IsOptional() @IsEnum(DocumentStatus) status: DocumentStatus =
    DocumentStatus.ACTIVE;
  @IsOptional() @IsEnum(DocumentSort) sort: DocumentSort =
    DocumentSort.CREATED_AT;
  @IsOptional() @IsEnum(SortDirection) direction: SortDirection =
    SortDirection.DESC;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page =
    1;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}
