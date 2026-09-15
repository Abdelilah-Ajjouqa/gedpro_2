import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/createUser.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Permissions, Roles } from '../auth/decorator/auth.decorator';
import { Role } from './enums/role.enum';
import { User } from './entities/user.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../common/swagger/api-protected.decorator';

@ApiTags('Users')
@ApiProtected()
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a user with an assigned role' })
    @Roles(Role.ADMIN)
    @Permissions('users:create')
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: 'List users' })
    @Roles(Role.ADMIN, Role.RH)
    @Permissions('users:read')
    findAll() {
        return this.usersService.findAll();
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get the authenticated user profile' })
    @Roles(Role.ADMIN, Role.RH, Role.MANAGER, Role.CANDIDATE) // All roles
    getProfile(@Req() req: any) {
        return req.user;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by ID' })
    @Roles(Role.ADMIN, Role.RH)
    @Permissions('users:read')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user' })
    @Roles(Role.ADMIN)
    @Permissions('users:update')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(+id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    @Roles(Role.ADMIN)
    @Permissions('users:delete')
    remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }
}
