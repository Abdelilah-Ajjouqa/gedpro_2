import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/users/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    UsersModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }
