import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/enums/role.enum';

export class PublicUserDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class CurrentUserDto {
  @ApiProperty({ type: PublicUserDto }) user: PublicUserDto;
  @ApiProperty({ type: [String] }) capabilities: string[];
}

export class AuthSessionDto extends CurrentUserDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ description: 'Backward-compatible access-token alias' })
  token: string;
  @ApiProperty({ example: 900 }) expiresIn: number;
}

export class MessageDto {
  @ApiProperty() message: string;
}
