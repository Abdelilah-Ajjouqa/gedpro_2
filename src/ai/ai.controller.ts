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
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { AiService } from './ai.service';
import {
  AiSearchDto,
  CorrectExtractionDto,
  ExtractCvDto,
  FeedbackDto,
  MatchJobDto,
  MonitoringQueryDto,
  SuggestQuestionsDto,
} from './dto/ai.dto';

@ApiTags('Responsible AI')
@ApiProtected()
@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RH, Role.MANAGER)
export class AiController {
  constructor(private ai: AiService) {}
  @Post('cv-extractions')
  @ApiOperation({
    summary: 'Extract editable structured data from CV text (advisory)',
  })
  @ApiBadRequestResponse({
    description: 'Document is not linked to the selected candidate',
  })
  extract(@Body() dto: ExtractCvDto, @Req() req: { user: User }) {
    return this.ai.extractCv(dto, req.user);
  }
  @Patch('cv-extractions/:id')
  @ApiOperation({ summary: 'Record a human correction to extracted CV data' })
  correct(
    @Param('id') id: string,
    @Body() dto: CorrectExtractionDto,
    @Req() req: { user: User },
  ) {
    return this.ai.correctExtraction(id, dto, req.user);
  }
  @Post('candidate-search')
  @ApiOperation({ summary: 'Full-text and local semantic candidate search' })
  search(@Body() dto: AiSearchDto, @Req() req: { user: User }) {
    return this.ai.search(dto, req.user);
  }
  @Post('job-matches')
  @ApiOperation({
    summary:
      'Explainable advisory matching using allow-listed, non-protected inputs',
  })
  match(@Body() dto: MatchJobDto, @Req() req: { user: User }) {
    return this.ai.match(dto, req.user);
  }
  @Post('interview-questions')
  @ApiOperation({ summary: 'Draft interview questions for human review' })
  questions(@Body() dto: SuggestQuestionsDto, @Req() req: { user: User }) {
    return this.ai.questions(dto, req.user);
  }
  @Post('applications/:id/summary')
  @ApiOperation({
    summary: 'Generate an advisory application and timeline summary',
  })
  @ApiNotFoundResponse({ description: 'Application does not exist' })
  summarize(@Param('id', ParseIntPipe) id: number, @Req() req: { user: User }) {
    return this.ai.summarize(id, req.user);
  }
  @Post('generations/:id/feedback')
  @ApiOperation({ summary: 'Record human feedback or an override' })
  feedback(
    @Param('id') id: string,
    @Body() dto: FeedbackDto,
    @Req() req: { user: User },
  ) {
    return this.ai.addFeedback(id, dto, req.user);
  }
  @Get('monitoring')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Quality, usage, cost, override, and protected-input monitoring',
  })
  monitoring(@Query() query: MonitoringQueryDto) {
    return this.ai.monitoring(query);
  }
}
