import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
export class FormConditionDto {
  @IsString() @IsNotEmpty() fieldId: string;
  @IsEnum(['equals', 'not_equals']) operator: string;
  @IsDefined() value: unknown;
}
export class CreateFormFieldDto {
  @IsOptional() @IsString() @IsNotEmpty() id?: string;
  @IsString() @IsNotEmpty() label: string;
  @IsEnum(['text', 'number', 'date', 'file', 'select', 'email', 'boolean'])
  type: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  options?: string[];
  @IsOptional()
  @ValidateNested()
  @Type(() => FormConditionDto)
  condition?: FormConditionDto;
}
export class CreateFormDto {
  @IsString() @IsNotEmpty() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields: CreateFormFieldDto[];
}
export class UpdateFormDto extends CreateFormDto {}
