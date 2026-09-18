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
import { AuthGuard } from '@nestjs/passport';
import { ApiConflictResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/swagger/api-error.dto';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { ApplicationsService } from './applications.service';
import {
  BulkMoveApplicationsDto,
  CreateApplicationDto,
  ListApplicationsDto,
  TransitionApplicationDto,
} from './dto/application.dto';
import { ApiProtected } from '../common/swagger/api-protected.decorator';

@ApiTags('Applications')
@ApiProtected()
@Controller('applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RH, Role.MANAGER)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}
  @Post()
  @ApiOperation({ summary: 'Open an application for a published job' })
  @ApiConflictResponse({
    description: 'Candidate already applied to this job',
    type: ApiErrorDto,
  })
  create(@Body() dto: CreateApplicationDto, @Req() req: any) {
    return this.applications.create(dto, req.user as User);
  }
  @Get() @ApiOperation({ summary: 'List applications with filters' }) findAll(
    @Query() query: ListApplicationsDto,
  ) {
    return this.applications.findAll(query);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get an application and its stage history' })
  findOne(@Param('id') id: string) {
    return this.applications.findOne(+id);
  }
  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move an application to another stage' })
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionApplicationDto,
    @Req() req: any,
  ) {
    return this.applications.transition(+id, dto, req.user as User);
  }
  @Post(':id/reopen')
  @ApiOperation({
    summary: 'Explicitly reopen a rejected or withdrawn application',
  })
  reopen(
    @Param('id') id: string,
    @Body() dto: TransitionApplicationDto,
    @Req() req: any,
  ) {
    return this.applications.reopen(+id, dto, req.user as User);
  }
  @Post('bulk-move')
  @ApiOperation({ summary: 'Move applications with per-item results' })
  bulk(@Body() dto: BulkMoveApplicationsDto, @Req() req: any) {
    return this.applications.bulkMove(dto, req.user as User);
  }
}
