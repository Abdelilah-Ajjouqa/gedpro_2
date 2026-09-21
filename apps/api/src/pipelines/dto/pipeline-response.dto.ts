import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StageCategory } from '../enums/stage-category.enum';
export class PipelineTransitionDto {
  @ApiProperty() id: number;
  @ApiProperty() toStageId: number;
}
export class PipelineStageResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ enum: StageCategory }) category: StageCategory;
  @ApiProperty() position: number;
  @ApiProperty() archived: boolean;
  @ApiProperty() version: number;
  @ApiProperty({ type: [PipelineTransitionDto] })
  outgoingTransitions: PipelineTransitionDto[];
}
export class ReadinessIssueDto {
  @ApiProperty() code: string;
  @ApiProperty() message: string;
  @ApiPropertyOptional({ type: [Number] }) stageIds?: number[];
}
export class PipelineReadinessDto {
  @ApiProperty() ready: boolean;
  @ApiProperty({ type: [ReadinessIssueDto] }) issues: ReadinessIssueDto[];
}
export class PipelineResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description?: string;
  @ApiProperty() isTemplate: boolean;
  @ApiProperty() archived: boolean;
  @ApiProperty({ type: [PipelineStageResponseDto] })
  stages: PipelineStageResponseDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() version: number;
  @ApiPropertyOptional() jobCount?: number;
  @ApiPropertyOptional() inUse?: boolean;
  @ApiPropertyOptional() canArchive?: boolean;
  @ApiPropertyOptional() canChangeRevision?: boolean;
  @ApiPropertyOptional({ type: PipelineReadinessDto })
  readiness?: PipelineReadinessDto;
}
export class PipelineListResponseDto {
  @ApiProperty({ type: [PipelineResponseDto] }) data: PipelineResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
