import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) firstName: string;
  @IsString() @MinLength(2) lastName: string;
  @IsString() @MinLength(12) password: string;
  @IsString() @MinLength(12) confirmPassword: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
