import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { SecurityAuditEvent } from '../auth/entities/security-audit-event.entity';
import { SecurityAuditService } from '../auth/security-audit.service';
import { AuthSession } from '../auth/entities/auth-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthSession, SecurityAuditEvent])],
  controllers: [UsersController],
  providers: [UsersService, SecurityAuditService],
  exports: [UsersService, SecurityAuditService],
})
export class UsersModule {}
