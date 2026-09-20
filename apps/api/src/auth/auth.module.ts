import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthSession } from './entities/auth-session.entity';
import { AuthActionToken } from './entities/auth-action-token.entity';
import { SecurityAuditEvent } from './entities/security-audit-event.entity';
import { AuthorizationService } from './authorization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthSession,
      AuthActionToken,
      SecurityAuditEvent,
    ]),
    UsersModule,
    PassportModule,
  ],
  providers: [AuthService, JwtStrategy, AuthorizationService],
  controllers: [AuthController],
  exports: [AuthService, AuthorizationService],
})
export class AuthModule {}
