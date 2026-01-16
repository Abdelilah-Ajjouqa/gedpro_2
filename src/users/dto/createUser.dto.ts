import { IsEmail, IsString, IsOptional, MinLength, IsBoolean, IsNotEmpty, IsEnum } from 'class-validator';
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

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @MinLength(6)
    confirmPassword: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
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
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
