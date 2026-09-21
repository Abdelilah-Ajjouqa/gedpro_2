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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/swagger/api-error.dto';
import { Permissions } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { User } from '../users/entities/user.entity';
import { ApplicationsService } from './applications.service';
import {
  BulkMoveApplicationsDto,
  CreateApplicationDto,
  ListApplicationsDto,
  ReopenApplicationDto,
  TransitionApplicationDto,
} from './dto/application.dto';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { CAPABILITIES } from '../auth/authorization.service';
import { parseRequiredEtag, quoteEtag } from '../common/http/etag';
import type { Response } from 'express';
import {
  ApplicationDetailDto,
  ApplicationListResponseDto,
  BulkMoveResponseDto,
} from './dto/application-response.dto';

@ApiTags('Applications')
@ApiProtected()
@Controller('applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}
  @Post()
  @ApiOperation({ summary: 'Open an application for a published job' })
  @ApiConflictResponse({
    description: 'Candidate already applied to this job',
    type: ApiErrorDto,
  })
  @ApiCreatedResponse({ type: ApplicationDetailDto })
  @Permissions(CAPABILITIES.APPLICATIONS_CREATE)
  create(@Body() dto: CreateApplicationDto, @Req() req: { user: User }) {
    return this.applications.create(dto, req.user);
  }
  @Get()
  @ApiOperation({ summary: 'List applications with filters' })
  @ApiOkResponse({ type: ApplicationListResponseDto })
  @Permissions(CAPABILITIES.APPLICATIONS_READ)
  findAll(@Query() query: ListApplicationsDto, @Req() req: { user: User }) {
    return this.applications.findAll(query, req.user);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get an application and its stage history' })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @Permissions(CAPABILITIES.APPLICATIONS_READ)
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.applications.findOne(+id, req.user);
    response.setHeader('ETag', quoteEtag(result.version));
    return result;
  }
  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move an application to another stage' })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @Permissions(CAPABILITIES.APPLICATIONS_TRANSITION)
  @HttpCode(200)
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionApplicationDto,
    @Req() req: { user: User },
    @Headers('if-match') etag?: string,
  ) {
    return this.applications.transition(
      +id,
      dto,
      req.user,
      parseRequiredEtag(etag),
    );
  }
  @Post(':id/reopen')
  @ApiOperation({
    summary: 'Explicitly reopen a rejected or withdrawn application',
  })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @Permissions(CAPABILITIES.APPLICATIONS_REOPEN)
  @HttpCode(200)
  reopen(
    @Param('id') id: string,
    @Body() dto: ReopenApplicationDto,
    @Req() req: { user: User },
    @Headers('if-match') etag?: string,
  ) {
    return this.applications.reopen(
      +id,
      dto,
      req.user,
      parseRequiredEtag(etag),
    );
  }
  @Post('bulk-move')
  @ApiOperation({ summary: 'Move applications with per-item results' })
  @ApiOkResponse({ type: BulkMoveResponseDto })
  @Permissions(CAPABILITIES.APPLICATIONS_BULK_MOVE)
  @HttpCode(200)
  bulk(@Body() dto: BulkMoveApplicationsDto, @Req() req: { user: User }) {
    return this.applications.bulkMove(dto, req.user);
  }
}
