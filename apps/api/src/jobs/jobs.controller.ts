import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { JobsService } from './jobs.service';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { CAPABILITIES } from '../auth/authorization.service';
import { parseRequiredEtag, quoteEtag } from '../common/http/etag';
import type { Response } from 'express';
import { JobListResponseDto, JobResponseDto } from './dto/job-response.dto';

@ApiTags('Jobs')
@ApiProtected()
@Controller('jobs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}
  @Post()
  @ApiOperation({ summary: 'Create a draft job' })
  @ApiCreatedResponse({ type: JobResponseDto })
  @Permissions(CAPABILITIES.JOBS_CREATE)
  create(@Body() dto: CreateJobDto, @Req() req: { user: User }) {
    return this.jobs.create(dto, req.user);
  }
  @Get()
  @ApiOperation({ summary: 'List and search jobs' })
  @ApiOkResponse({ type: JobListResponseDto })
  @Permissions(CAPABILITIES.JOBS_READ)
  findAll(@Query() query: ListJobsDto, @Req() req: { user: User }) {
    return this.jobs.findAll(query, req.user);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiOkResponse({ type: JobResponseDto })
  @HttpCode(200)
  @Permissions(CAPABILITIES.JOBS_READ)
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.jobs.findOne(+id, req.user);
    response.setHeader('ETag', quoteEtag(result.version));
    return result;
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a job' })
  @ApiOkResponse({ type: JobResponseDto })
  @HttpCode(200)
  @Permissions(CAPABILITIES.JOBS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @Headers('if-match') etag?: string,
  ) {
    return this.jobs.update(+id, dto, parseRequiredEtag(etag));
  }
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a job' })
  @ApiOkResponse({ type: JobResponseDto })
  @HttpCode(200)
  @Permissions(CAPABILITIES.JOBS_PUBLISH)
  publish(@Param('id') id: string, @Headers('if-match') etag?: string) {
    return this.jobs.publish(+id, parseRequiredEtag(etag));
  }
  @Post(':id/close')
  @ApiOperation({ summary: 'Close a job' })
  @ApiOkResponse({ type: JobResponseDto })
  @HttpCode(200)
  @Permissions(CAPABILITIES.JOBS_CLOSE)
  close(@Param('id') id: string, @Headers('if-match') etag?: string) {
    return this.jobs.close(+id, parseRequiredEtag(etag));
  }
  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a closed job' })
  @ApiOkResponse({ type: JobResponseDto })
  @HttpCode(200)
  @Permissions(CAPABILITIES.JOBS_REOPEN)
  reopen(@Param('id') id: string, @Headers('if-match') etag?: string) {
    return this.jobs.reopen(+id, parseRequiredEtag(etag));
  }
  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a job' })
  @ApiOkResponse({ type: JobResponseDto })
  @HttpCode(200)
  @Permissions(CAPABILITIES.JOBS_ARCHIVE)
  archive(@Param('id') id: string, @Headers('if-match') etag?: string) {
    return this.jobs.archive(+id, parseRequiredEtag(etag));
  }
}
