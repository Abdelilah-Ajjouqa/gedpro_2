import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Permissions, Roles } from '../auth/decorator/auth.decorator';
import { Role } from './enums/role.enum';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUserDto } from '../auth/dto/session.dto';
import { User } from './entities/user.entity';
import {
  AccountStateDto,
  CreateUserDto,
  ListUsersDto,
  UpdateUserDto,
  UserDto,
  UserListResponseDto,
} from './dto/createUser.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiProtected()
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Post()
  @Roles(Role.ADMIN)
  @Permissions('users:create')
  @ApiOkResponse({ type: UserDto })
  create(@Body() dto: CreateUserDto, @Req() req: { user: User }) {
    return this.users.createManaged(dto, req.user.id);
  }
  @Get()
  @Roles(Role.ADMIN)
  @Permissions('users:read')
  @ApiOkResponse({ type: UserListResponseDto })
  findAll(@Query() query: ListUsersDto) {
    return this.users.findAllSafe(query);
  }
  @Get('profile')
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER, Role.CANDIDATE)
  @ApiOkResponse({ type: CurrentUserDto })
  getProfile(@Req() req: { user: User }) {
    return {
      user: this.users.toDto(req.user),
      capabilities: AuthorizationService.capabilitiesFor(req.user.role),
    };
  }
  @Get(':id')
  @Roles(Role.ADMIN)
  @Permissions('users:read')
  @ApiOkResponse({ type: UserDto })
  findOne(@Param('id') id: string) {
    return this.users.findOneSafe(+id);
  }
  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('users:update')
  @ApiOkResponse({ type: UserDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: { user: User },
  ) {
    return this.users.updateManaged(+id, dto, req.user.id);
  }
  @Post(':id/deactivate')
  @Roles(Role.ADMIN)
  @Permissions('users:update')
  @ApiOkResponse({ type: UserDto })
  deactivate(
    @Param('id') id: string,
    @Body() dto: AccountStateDto,
    @Req() req: { user: User },
  ) {
    return this.users.setActive(+id, false, dto.reason, req.user.id);
  }
  @Post(':id/activate')
  @Roles(Role.ADMIN)
  @Permissions('users:update')
  @ApiOkResponse({ type: UserDto })
  activate(
    @Param('id') id: string,
    @Body() dto: AccountStateDto,
    @Req() req: { user: User },
  ) {
    return this.users.setActive(+id, true, dto.reason, req.user.id);
  }
}
