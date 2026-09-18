import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateCandidateDto {
  @IsNotEmpty() @IsString() @MaxLength(100) firstName: string;
  @IsNotEmpty() @IsString() @MaxLength(100) lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsInt() ownerId?: number;
  @IsOptional() @IsBoolean() privacyConsent?: boolean;
  @IsOptional() @IsDateString() retentionUntil?: string;
}
export class UpdateCandidateDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsInt() ownerId?: number;
  @IsOptional() @IsBoolean() privacyConsent?: boolean;
  @IsOptional() @IsDateString() retentionUntil?: string;
}
export class ListCandidatesDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() skill?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @Type(() => Number) @IsInt() ownerId?: number;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived = false;
  @IsOptional() @IsIn(['createdAt', 'updatedAt', 'lastName', 'email']) sortBy =
    'createdAt';
  @IsOptional() @IsIn(['ASC', 'DESC']) sortOrder: 'ASC' | 'DESC' = 'DESC';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
export class MergeCandidatesDto {
  @IsInt() sourceCandidateId: number;
}
