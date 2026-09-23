import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Headers,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorator/auth.decorator';
import { CAPABILITIES } from '../auth/authorization.service';
import { parseRequiredEtag, quoteEtag } from '../common/http/etag';
import type { Response } from 'express';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import {
  CreateInterviewDto,
  CreateScorecardTemplateDto,
  InterviewOutcomeDto,
  ListInterviewsDto,
  RescheduleInterviewDto,
  SubmitScorecardDto,
} from './dto/interview.dto';
import { InterviewsService } from './interviews.service';
import {
  DecisionSummaryResponseDto,
  InterviewDetailDto,
  InterviewListResponseDto,
  ScorecardAssignmentResponseDto,
  ScorecardTemplateResponseDto,
} from './dto/interview-response.dto';

@ApiTags('Interviews')
@ApiProtected()
@Controller('interviews')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}
  @Post()
  @Permissions(CAPABILITIES.INTERVIEWS_MANAGE)
  @ApiOperation({ summary: 'Schedule a panel interview and assign scorecards' })
  @ApiCreatedResponse({ type: InterviewDetailDto })
  @ApiConflictResponse({ description: 'An interviewer is unavailable' })
  @ApiNotFoundResponse({
    description: 'Candidate, application, user, or template not found',
  })
  create(@Body() dto: CreateInterviewDto, @Req() req: { user: User }) {
    return this.service.create(dto, req.user);
  }
  @Get()
  @Permissions(CAPABILITIES.INTERVIEWS_READ)
  @ApiOperation({ summary: 'List interviews' })
  @ApiOkResponse({ type: InterviewListResponseDto })
  findAll(@Query() query: ListInterviewsDto, @Req() req: { user: User }) {
    return this.service.findAll(query, req.user);
  }
  @Post('scorecard-templates')
  @Permissions(CAPABILITIES.SCORECARD_TEMPLATES_CREATE)
  @ApiOperation({ summary: 'Create a job or stage scorecard template' })
  @ApiCreatedResponse({ type: ScorecardTemplateResponseDto })
  createTemplate(@Body() dto: CreateScorecardTemplateDto) {
    return this.service.createTemplate(dto);
  }
  @Get('scorecard-templates/list')
  @Permissions(CAPABILITIES.SCORECARD_TEMPLATES_READ)
  @ApiOperation({ summary: 'List active scorecard templates' })
  @ApiOkResponse({ type: ScorecardTemplateResponseDto, isArray: true })
  templates(
    @Query('jobId') jobId?: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.service.listTemplates(
      jobId ? +jobId : undefined,
      stageId ? +stageId : undefined,
    );
  }
  @Post('scorecards/:id/submit')
  @Permissions(CAPABILITIES.INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD)
  @ApiOperation({ summary: 'Submit assigned structured feedback once' })
  @ApiCreatedResponse({ type: ScorecardAssignmentResponseDto })
  @ApiForbiddenResponse({ description: 'Not the assigned reviewer' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitScorecardDto,
    @Req() req: { user: User },
  ) {
    return this.service.submitScorecard(id, dto, req.user);
  }
  @Get('applications/:applicationId/decision-summary')
  @Permissions(CAPABILITIES.INTERVIEWS_DECISION_SUMMARY_READ)
  @ApiOperation({
    summary: 'Show completed and missing scorecards for a hiring decision',
  })
  @ApiOkResponse({ type: DecisionSummaryResponseDto })
  summary(
    @Param('applicationId', ParseIntPipe) id: number,
    @Req() req: { user: User },
  ) {
    return this.service.decisionSummary(id, req.user);
  }
  @Get(':id')
  @Permissions(CAPABILITIES.INTERVIEWS_READ)
  @ApiOperation({ summary: 'Get interview with panel and scorecards' })
  @ApiOkResponse({ type: InterviewDetailDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: User },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.getOne(id, req.user);
    response.setHeader('ETag', quoteEtag(result.version));
    return result;
  }
  @Patch(':id/reschedule')
  @Permissions(CAPABILITIES.INTERVIEWS_MANAGE)
  @ApiOperation({ summary: 'Reschedule an interview with conflict detection' })
  @ApiOkResponse({ type: InterviewDetailDto })
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleInterviewDto,
    @Req() req: { user: User },
    @Headers('if-match') etag?: string,
  ) {
    return this.service.reschedule(id, dto, req.user, parseRequiredEtag(etag));
  }
  @Patch(':id/outcome')
  @Permissions(CAPABILITIES.INTERVIEWS_RECORD_OUTCOME)
  @ApiOperation({
    summary: 'Mark an interview completed, cancelled, or no-show',
  })
  @ApiOkResponse({ type: InterviewDetailDto })
  outcome(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InterviewOutcomeDto,
    @Req() req: { user: User },
    @Headers('if-match') etag?: string,
  ) {
    return this.service.outcome(id, dto, req.user, parseRequiredEtag(etag));
  }
  @Patch(':id/cancel')
  @Permissions(CAPABILITIES.INTERVIEWS_RECORD_OUTCOME)
  @ApiOperation({ summary: 'Cancel an interview' })
  @ApiOkResponse({ type: InterviewDetailDto })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: User },
    @Headers('if-match') etag?: string,
  ) {
    return this.service.cancel(id, req.user, parseRequiredEtag(etag));
  }
}
