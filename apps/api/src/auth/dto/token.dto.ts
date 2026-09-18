import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString() @IsNotEmpty() refreshToken: string;
}
export class LogoutDto {
  @IsString() @IsNotEmpty() refreshToken: string;
}
export class RequestPasswordResetDto {
  @IsEmail() email: string;
}
export class ResetPasswordDto {
  @IsString() @IsNotEmpty() token: string;
  @IsString() @MinLength(12) password: string;
  @IsString() @MinLength(12) confirmPassword: string;
}
export class RequestEmailVerificationDto {
  @IsEmail() email: string;
}
export class VerifyEmailDto {
  @IsString() @IsNotEmpty() token: string;
}
