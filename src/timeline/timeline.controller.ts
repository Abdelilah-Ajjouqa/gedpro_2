import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateTimelineNoteDto, TimelineQueryDto } from './dto/timeline.dto';
import { TimelineService } from './timeline.service';

@ApiTags('Timeline')
@ApiProtected()
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RH, Role.MANAGER, Role.CANDIDATE)
export class TimelineController {
  constructor(private readonly timeline: TimelineService) {}
  @Get('candidates/:id/timeline')
  @ApiOperation({ summary: 'Get the stable chronological candidate journey' })
  @ApiOkResponse({ description: 'Timeline page with an opaque nextCursor' })
  @ApiBadRequestResponse({ description: 'Malformed cursor' })
  candidate(
    @Param('id') id: string,
    @Query() query: TimelineQueryDto,
    @Req() req: any,
  ) {
    return this.timeline.candidateTimeline(+id, query, req.user as User);
  }
  @Get('applications/:id/timeline')
  @ApiOperation({ summary: 'Get the stable chronological application journey' })
  @ApiOkResponse({ description: 'Timeline page with an opaque nextCursor' })
  application(
    @Param('id') id: string,
    @Query() query: TimelineQueryDto,
    @Req() req: any,
  ) {
    return this.timeline.applicationTimeline(+id, query, req.user as User);
  }
  @Post('candidates/:id/timeline/notes')
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  @ApiOperation({ summary: 'Add a candidate timeline note' })
  @ApiCreatedResponse({ description: 'Note event created' })
  candidateNote(
    @Param('id') id: string,
    @Body() dto: CreateTimelineNoteDto,
    @Req() req: any,
  ) {
    return this.timeline.addCandidateNote(+id, dto, req.user);
  }
  @Post('applications/:id/timeline/notes')
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  @ApiOperation({ summary: 'Add an application timeline note' })
  @ApiCreatedResponse({ description: 'Note event created' })
  applicationNote(
    @Param('id') id: string,
    @Body() dto: CreateTimelineNoteDto,
    @Req() req: any,
  ) {
    return this.timeline.addApplicationNote(+id, dto, req.user);
  }
}
