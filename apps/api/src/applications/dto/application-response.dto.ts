import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StageCategory } from '../../pipelines/enums/stage-category.enum';

export class ApplicationPersonRefDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
}
export class ApplicationCandidateRefDto extends ApplicationPersonRefDto {
  @ApiPropertyOptional({ nullable: true }) email?: string;
}
export class ApplicationJobRefDto {
  @ApiProperty() id: number;
  @ApiProperty() title: string;
}
export class ApplicationStageDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ enum: StageCategory }) category: StageCategory;
  @ApiProperty() position: number;
  @ApiProperty() archived: boolean;
  @ApiProperty() terminal: boolean;
}
export class AllowedApplicationTransitionDto {
  @ApiProperty({ type: ApplicationStageDto }) stage: ApplicationStageDto;
  @ApiProperty() requiresRejectionReason: boolean;
}
export class ApplicationSummaryDto {
  @ApiProperty() id: number;
  @ApiProperty() version: number;
  @ApiProperty({ type: ApplicationCandidateRefDto })
  candidate: ApplicationCandidateRefDto;
  @ApiProperty({ type: ApplicationJobRefDto }) job: ApplicationJobRefDto;
  @ApiPropertyOptional({ type: ApplicationPersonRefDto, nullable: true })
  owner?: ApplicationPersonRefDto;
  @ApiProperty({ type: ApplicationStageDto }) currentStage: ApplicationStageDto;
  @ApiPropertyOptional({ nullable: true }) source?: string;
  @ApiProperty() terminal: boolean;
  @ApiProperty() reopenEligible: boolean;
  @ApiProperty({ type: [String] }) allowedActions: string[];
  @ApiProperty({ type: [AllowedApplicationTransitionDto] })
  allowedTransitions: AllowedApplicationTransitionDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
export class ApplicationHistoryEntryDto {
  @ApiProperty() id: number;
  @ApiProperty({ enum: ['created', 'transitioned', 'reopened'] }) kind: string;
  @ApiPropertyOptional({ type: ApplicationStageDto, nullable: true })
  previousStage?: ApplicationStageDto;
  @ApiProperty({ type: ApplicationStageDto }) newStage: ApplicationStageDto;
  @ApiPropertyOptional({ nullable: true }) comment?: string;
  @ApiPropertyOptional({ nullable: true }) rejectionReason?: string;
  @ApiPropertyOptional({ type: ApplicationPersonRefDto, nullable: true })
  actor?: ApplicationPersonRefDto;
  @ApiProperty() changedAt: Date;
}
export class ApplicationDetailDto extends ApplicationSummaryDto {
  @ApiProperty({ type: [ApplicationHistoryEntryDto] })
  history: ApplicationHistoryEntryDto[];
  @ApiPropertyOptional({ nullable: true }) rejectionReason?: string;
}
export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationSummaryDto] }) data: ApplicationSummaryDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
export class BulkMoveResultDto {
  @ApiProperty() applicationId: number;
  @ApiProperty() success: boolean;
  @ApiPropertyOptional({ type: ApplicationSummaryDto })
  application?: ApplicationSummaryDto;
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() message?: string;
  @ApiPropertyOptional() currentVersion?: number;
}
export class BulkMoveResponseDto {
  @ApiProperty({ type: [BulkMoveResultDto] }) results: BulkMoveResultDto[];
}
