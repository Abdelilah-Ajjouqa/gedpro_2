import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateFormFieldDto {
    @IsNotEmpty()
    @IsString()
    label: string;

    @IsNotEmpty()
    @IsEnum(['text', 'number', 'date', 'file', 'select', 'email'])
    type: string;

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];
}

export class CreateFormDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDefined()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFormFieldDto)
    fields: CreateFormFieldDto[];
}
