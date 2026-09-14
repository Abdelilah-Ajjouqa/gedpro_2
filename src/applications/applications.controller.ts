import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, ListApplicationsDto, TransitionApplicationDto } from './dto/application.dto';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RH, Role.MANAGER)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}
  @Post() create(@Body() dto: CreateApplicationDto, @Req() req: any) { return this.applications.create(dto, req.user as User); }
  @Get() findAll(@Query() query: ListApplicationsDto) { return this.applications.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.applications.findOne(+id); }
  @Patch(':id/stage') transition(@Param('id') id: string, @Body() dto: TransitionApplicationDto, @Req() req: any) { return this.applications.transition(+id, dto, req.user as User); }
}
