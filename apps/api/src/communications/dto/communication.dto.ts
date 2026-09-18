import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CommunicationType,
  DeliveryStatus,
} from '../entities/communication.entity';

export class CreateTemplateDto {
  @IsString() @MinLength(2) @MaxLength(80) key: string;
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsString() @MinLength(1) @MaxLength(240) subject: string;
  @IsString() @MinLength(1) @ApiProperty() htmlBody: string;
}
export class QueueCommunicationDto {
  @IsEnum(CommunicationType) type: CommunicationType;
  @IsOptional() @IsEmail() recipient?: string;
  @IsOptional() @IsString() templateKey?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) candidateId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) applicationId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) interviewId?: number;
  @IsOptional() @IsObject() variables?: Record<string, unknown>;
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  @ApiProperty({ description: 'Stable caller-generated deduplication key' })
  idempotencyKey: string;
}
export class CommunicationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) candidateId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) applicationId?: number;
  @IsOptional() @IsEnum(DeliveryStatus) status?: DeliveryStatus;
}
export class PreferenceDto {
  @IsOptional() @IsBoolean() applicationUpdates?: boolean;
  @IsOptional() @IsBoolean() interviewUpdates?: boolean;
  @IsOptional() @IsBoolean() outcomeUpdates?: boolean;
}
export class WebhookDto {
  @IsString() providerMessageId: string;
  @IsEnum(DeliveryStatus) status: DeliveryStatus;
  @IsOptional() @IsString() error?: string;
}
