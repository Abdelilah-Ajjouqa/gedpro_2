import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
