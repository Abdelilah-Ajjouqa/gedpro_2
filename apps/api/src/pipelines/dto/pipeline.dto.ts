import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { StageCategory } from '../enums/stage-category.enum';
export class CreateStageDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsEnum(StageCategory) category: StageCategory;
  @IsInt() @Min(1) position: number;
}
export class CreatePipelineDto {
  @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isTemplate = true;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages: CreateStageDto[];
}
export class UpdatePipelineDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isTemplate?: boolean;
}
export class ReorderStagesDto {
  @IsArray() @ArrayMinSize(1) @IsInt({ each: true }) stageIds: number[];
}
export class SetTransitionsDto {
  @IsArray() @IsInt({ each: true }) toStageIds: number[];
}
