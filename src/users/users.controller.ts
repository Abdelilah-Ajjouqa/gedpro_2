import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/createUser.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/auth.decorator';
import { Role } from './enums/role.enum';
import { User } from './entities/user.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(Role.ADMIN)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.RH)
    findAll() {
        return this.usersService.findAll();
    }

    @Get('profile')
    @Roles(Role.ADMIN, Role.RH, Role.MANAGER, Role.CANDIDATE) // All roles
    getProfile(@Req() req: any) {
        return req.user;
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.RH)
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(+id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(+id, updateUserDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }
}
