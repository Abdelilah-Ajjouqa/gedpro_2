import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { Role } from '../users/enums/role.enum';
import {
  CreatePipelineDto,
  CreateStageDto,
  ReorderStagesDto,
  SetTransitionsDto,
  UpdatePipelineDto,
} from './dto/pipeline.dto';
import { PipelinesService } from './pipelines.service';
@ApiTags('Pipelines')
@ApiProtected()
@Controller('pipelines')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RH)
export class PipelinesController {
  constructor(private service: PipelinesService) {}
  @Post()
  @ApiOperation({ summary: 'Create a reusable pipeline template' })
  create(@Body() d: CreatePipelineDto) {
    return this.service.create(d);
  }
  @Get()
  @ApiOperation({ summary: 'List active pipelines and ordered stages' })
  list() {
    return this.service.findAll();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline transition graph' })
  @ApiNotFoundResponse({ description: 'Pipeline not found' })
  one(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update pipeline metadata' }) update(
    @Param('id') id: string,
    @Body() d: UpdatePipelineDto,
  ) {
    return this.service.update(+id, d);
  }
  @Delete(':id') @ApiOperation({ summary: 'Archive a pipeline' }) archive(
    @Param('id') id: string,
  ) {
    return this.service.archive(+id);
  }
  @Post(':id/stages') @ApiOperation({ summary: 'Add a custom stage' }) add(
    @Param('id') id: string,
    @Body() d: CreateStageDto,
  ) {
    return this.service.addStage(+id, d);
  }
  @Put(':id/stages/order')
  @ApiOperation({ summary: 'Reorder all pipeline stages' })
  @ApiBadRequestResponse({ description: 'Incomplete or invalid ordering' })
  order(@Param('id') id: string, @Body() d: ReorderStagesDto) {
    return this.service.reorder(+id, d);
  }
  @Delete(':id/stages/:stageId')
  @ApiOperation({ summary: 'Archive a stage without deleting history' })
  archiveStage(@Param('id') id: string, @Param('stageId') s: string) {
    return this.service.archiveStage(+id, +s);
  }
  @Put(':id/stages/:stageId/transitions')
  @ApiOperation({ summary: 'Replace allowed outgoing transitions' })
  transitions(
    @Param('id') id: string,
    @Param('stageId') s: string,
    @Body() d: SetTransitionsDto,
  ) {
    return this.service.setTransitions(+id, +s, d);
  }
}
