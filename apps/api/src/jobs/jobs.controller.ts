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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { JobStatus } from './enums/job-status.enum';
import { JobsService } from './jobs.service';
import { ApiProtected } from '../common/swagger/api-protected.decorator';

@ApiTags('Jobs')
@ApiProtected()
@Controller('jobs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}
  @Post()
  @ApiOperation({ summary: 'Create a draft job' })
  @Roles(Role.ADMIN, Role.RH)
  create(@Body() dto: CreateJobDto, @Req() req: { user: User }) {
    return this.jobs.create(dto, req.user);
  }
  @Get()
  @ApiOperation({ summary: 'List and search jobs' })
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  findAll(@Query() query: ListJobsDto, @Req() req: { user: User }) {
    return this.jobs.findAll(query, req.user);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  findOne(@Param('id') id: string, @Req() req: { user: User }) {
    return this.jobs.findOne(+id, req.user);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a job' })
  @Roles(Role.ADMIN, Role.RH)
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobs.update(+id, dto);
  }
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a job' })
  @Roles(Role.ADMIN, Role.RH)
  publish(@Param('id') id: string) {
    return this.jobs.changeStatus(+id, JobStatus.PUBLISHED);
  }
  @Post(':id/close')
  @ApiOperation({ summary: 'Close a job' })
  @Roles(Role.ADMIN, Role.RH)
  close(@Param('id') id: string) {
    return this.jobs.changeStatus(+id, JobStatus.CLOSED);
  }
  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a job' })
  @Roles(Role.ADMIN)
  archive(@Param('id') id: string) {
    return this.jobs.changeStatus(+id, JobStatus.ARCHIVED);
  }
}
