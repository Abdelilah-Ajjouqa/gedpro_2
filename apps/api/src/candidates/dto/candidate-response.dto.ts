import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CandidateState } from '../enums/candidate-state.enum';

export class CandidateOwnerDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
}

export class CandidateListItemDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional({ nullable: true }) phone: string | null;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty({ type: [String] }) skills: string[];
  @ApiPropertyOptional({ nullable: true }) source: string | null;
  @ApiPropertyOptional({ type: CandidateOwnerDto, nullable: true })
  owner: CandidateOwnerDto | null;
  @ApiProperty({ enum: CandidateState }) state: CandidateState;
  @ApiProperty({ enum: ['active', 'archived', 'merged', 'erased'] })
  disposition: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() version: number;
}

export class CandidateStateHistoryDto {
  @ApiProperty() id: number;
  @ApiProperty({ enum: CandidateState }) previousState: CandidateState;
  @ApiProperty({ enum: CandidateState }) newState: CandidateState;
  @ApiPropertyOptional({ nullable: true }) comment: string | null;
  @ApiProperty() changedAt: Date;
  @ApiPropertyOptional({ type: CandidateOwnerDto, nullable: true })
  changedBy: CandidateOwnerDto | null;
}

export class CandidatePrivacyStatusDto {
  @ApiProperty() consent: boolean;
  @ApiPropertyOptional({ nullable: true }) consentAt: Date | null;
  @ApiPropertyOptional({ nullable: true }) retentionUntil: Date | null;
  @ApiPropertyOptional({ nullable: true }) deletionRequestedAt: Date | null;
  @ApiPropertyOptional({ nullable: true }) erasedAt: Date | null;
  @ApiProperty() erasureBlocked: boolean;
  @ApiProperty({ type: [String] }) allowedActions: string[];
}

export class CandidateDetailDto extends CandidateListItemDto {
  @ApiProperty({ type: [CandidateStateHistoryDto] })
  stateHistory: CandidateStateHistoryDto[];
  @ApiPropertyOptional({ nullable: true }) mergedInto: {
    id: number;
    displayName: string;
  } | null;
  @ApiPropertyOptional({ type: CandidatePrivacyStatusDto, nullable: true })
  privacy: CandidatePrivacyStatusDto | null;
  @ApiProperty() applicationCount: number;
  @ApiProperty({ type: [String] }) allowedActions: string[];
}

export class CandidateListResponseDto {
  @ApiProperty({ type: [CandidateListItemDto] }) data: CandidateListItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class CandidateDuplicateDto extends CandidateListItemDto {
  @ApiProperty({ type: [String] }) matchReasons: string[];
}
