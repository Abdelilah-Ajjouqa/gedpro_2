import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
} from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {
  CreateInterviewDto,
  CreateScorecardTemplateDto,
  InterviewOutcomeDto,
  RescheduleInterviewDto,
  SubmitScorecardDto,
} from './dto/interview.dto';
import { InterviewsService } from './interviews.service';

@ApiTags('Interviews')
@ApiProtected()
@Controller('interviews')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}
  @Post()
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Schedule a panel interview and assign scorecards' })
  @ApiConflictResponse({ description: 'An interviewer is unavailable' })
  @ApiNotFoundResponse({
    description: 'Candidate, application, user, or template not found',
  })
  create(@Body() dto: CreateInterviewDto, @Req() req: { user: User }) {
    return this.service.create(dto, req.user);
  }
  @Get()
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List interviews' })
  findAll(@Req() req: { user: User }) {
    return this.service.findAll(req.user);
  }
  @Get(':id')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get interview with panel and scorecards' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: { user: User }) {
    return this.service.getOne(id, req.user);
  }
  @Patch(':id/reschedule')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Reschedule an interview with conflict detection' })
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleInterviewDto,
    @Req() req: { user: User },
  ) {
    return this.service.reschedule(id, dto, req.user);
  }
  @Patch(':id/outcome')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Mark an interview completed, cancelled, or no-show',
  })
  outcome(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InterviewOutcomeDto,
    @Req() req: { user: User },
  ) {
    return this.service.outcome(id, dto, req.user);
  }
  @Patch(':id/cancel')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cancel an interview' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: { user: User }) {
    return this.service.cancel(id, req.user);
  }
  @Post('scorecard-templates')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a job or stage scorecard template' })
  createTemplate(@Body() dto: CreateScorecardTemplateDto) {
    return this.service.createTemplate(dto);
  }
  @Get('scorecard-templates/list')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List active scorecard templates' })
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
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Submit assigned structured feedback once' })
  @ApiForbiddenResponse({ description: 'Not the assigned reviewer' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitScorecardDto,
    @Req() req: { user: User },
  ) {
    return this.service.submitScorecard(id, dto, req.user);
  }
  @Get('applications/:applicationId/decision-summary')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Show completed and missing scorecards for a hiring decision',
  })
  summary(
    @Param('applicationId', ParseIntPipe) id: number,
    @Req() req: { user: User },
  ) {
    return this.service.decisionSummary(id, req.user);
  }
}
