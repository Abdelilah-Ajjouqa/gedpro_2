import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateFormDto, UpdateFormDto } from './dto/create-form.dto';
import {
  AssignFormDto,
  ListResponsesDto,
  ReviewResponseDto,
  SubmitResponseDto,
} from './dto/submit-response.dto';
import { FormsService } from './forms.service';
@ApiTags('Forms and evaluations')
@ApiProtected()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly service: FormsService) {}
  @Post()
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({
    summary: 'Create a draft form with stable field identifiers',
  })
  create(@Body() dto: CreateFormDto, @Req() req: { user: User }) {
    return this.service.createForm(dto, req.user);
  }
  @Get() @Roles(Role.RH, Role.ADMIN, Role.MANAGER) findAll(
    @Query('includeArchived') archived?: string,
  ) {
    return this.service.findAll(archived === 'true');
  }
  @Get('assignments/application/:applicationId')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER, Role.CANDIDATE)
  @ApiOperation({
    summary:
      'List forms automatically assigned for an application current stage',
  })
  assigned(@Param('applicationId') id: string) {
    return this.service.assignedForApplication(Number(id));
  }
  @Get(':id') @Roles(Role.RH, Role.ADMIN, Role.MANAGER, Role.CANDIDATE) findOne(
    @Param('id') id: string,
  ) {
    return this.service.findOne(id);
  }
  @Put(':id')
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({
    summary: 'Edit draft or create a new draft version of a published form',
  })
  update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.service.update(id, dto);
  }
  @Post(':id/publish') @Roles(Role.RH, Role.ADMIN) publish(
    @Param('id') id: string,
  ) {
    return this.service.publish(id);
  }
  @Post(':id/duplicate') @Roles(Role.RH, Role.ADMIN) duplicate(
    @Param('id') id: string,
    @Req() req: { user: User },
  ) {
    return this.service.duplicate(id, req.user);
  }
  @Patch(':id/archive') @Roles(Role.RH, Role.ADMIN) archive(
    @Param('id') id: string,
  ) {
    return this.service.archive(id);
  }
  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiConflictResponse({
    description: 'Forms with responses cannot be deleted',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  @Post(':id/assignments') @Roles(Role.RH, Role.ADMIN) assign(
    @Param('id') id: string,
    @Body() dto: AssignFormDto,
    @Req() req: { user: User },
  ) {
    return this.service.assign(id, dto, req.user);
  }
  @Post(':id/submit')
  @Roles(Role.CANDIDATE, Role.RH, Role.ADMIN, Role.MANAGER)
  @ApiBody({ type: SubmitResponseDto })
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitResponseDto,
    @Req() req: { user: User },
  ) {
    return this.service.submitResponse(id, dto, req.user);
  }
  @Get(':id/responses') @Roles(Role.RH, Role.ADMIN, Role.MANAGER) getResponses(
    @Param('id') id: string,
    @Query() query: ListResponsesDto,
  ) {
    return this.service.getResponses(id, query);
  }
  @Patch(':id/responses/:responseId/review')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  review(
    @Param('id') formId: string,
    @Param('responseId') responseId: string,
    @Body() dto: ReviewResponseDto,
    @Req() req: { user: User },
  ) {
    return this.service.review(formId, responseId, dto, req.user);
  }
  @Get(':id/responses/export')
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  export(@Param('id') id: string) {
    return this.service.exportCsv(id);
  }
}
