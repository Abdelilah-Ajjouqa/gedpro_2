import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from '../enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEnum(Role)
  role: Role;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UserDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() isActive: boolean;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
export class UserListItemDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
}
export class UserListResponseDto {
  @ApiProperty({ type: [UserListItemDto] }) data: UserListItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
export class ListUsersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q?: string;
  @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class AccountStateDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason: string;
}
