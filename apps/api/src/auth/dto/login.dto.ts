import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/createUser.dto';

export class RegisterDto extends OmitType(CreateUserDto, ['role'] as const) {}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
