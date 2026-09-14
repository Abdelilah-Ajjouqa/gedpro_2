import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { JobStatus } from './enums/job-status.enum';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}
  @Post() @Roles(Role.ADMIN, Role.RH) create(@Body() dto: CreateJobDto, @Req() req: any) { return this.jobs.create(dto, req.user as User); }
  @Get() @Roles(Role.ADMIN, Role.RH, Role.MANAGER) findAll(@Query() query: ListJobsDto) { return this.jobs.findAll(query); }
  @Get(':id') @Roles(Role.ADMIN, Role.RH, Role.MANAGER) findOne(@Param('id') id: string) { return this.jobs.findOne(+id); }
  @Patch(':id') @Roles(Role.ADMIN, Role.RH) update(@Param('id') id: string, @Body() dto: UpdateJobDto) { return this.jobs.update(+id, dto); }
  @Post(':id/publish') @Roles(Role.ADMIN, Role.RH) publish(@Param('id') id: string) { return this.jobs.changeStatus(+id, JobStatus.PUBLISHED); }
  @Post(':id/close') @Roles(Role.ADMIN, Role.RH) close(@Param('id') id: string) { return this.jobs.changeStatus(+id, JobStatus.CLOSED); }
  @Post(':id/archive') @Roles(Role.ADMIN) archive(@Param('id') id: string) { return this.jobs.changeStatus(+id, JobStatus.ARCHIVED); }
}
