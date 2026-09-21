import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { CAPABILITIES } from '../auth/authorization.service';
import {
  CreatePipelineDto,
  CreateStageDto,
  ListPipelinesDto,
  ReorderStagesDto,
  SetTransitionsDto,
  UpdatePipelineDto,
  UpdateStageDto,
} from './dto/pipeline.dto';
import { PipelinesService } from './pipelines.service';
import {
  PipelineListResponseDto,
  PipelineResponseDto,
  PipelineStageResponseDto,
  PipelineTransitionDto,
} from './dto/pipeline-response.dto';
@ApiTags('Pipelines')
@ApiProtected()
@Controller('pipelines')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PipelinesController {
  constructor(private service: PipelinesService) {}
  @Post()
  @ApiOperation({ summary: 'Create a reusable pipeline template' })
  @ApiCreatedResponse({ type: PipelineResponseDto })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  create(@Body() d: CreatePipelineDto) {
    return this.service.create(d);
  }
  @Get()
  @ApiOperation({ summary: 'List active pipelines and ordered stages' })
  @ApiOkResponse({ type: PipelineListResponseDto })
  @Permissions(CAPABILITIES.PIPELINES_READ)
  list(@Query() query: ListPipelinesDto) {
    return this.service.findAll(query);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline transition graph' })
  @ApiNotFoundResponse({ description: 'Pipeline not found' })
  @ApiOkResponse({ type: PipelineResponseDto })
  @Permissions(CAPABILITIES.PIPELINES_READ)
  one(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update pipeline metadata' })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  @ApiOkResponse({ type: PipelineResponseDto })
  update(@Param('id') id: string, @Body() d: UpdatePipelineDto) {
    return this.service.update(+id, d);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Archive a pipeline' })
  @Permissions(CAPABILITIES.PIPELINES_ARCHIVE)
  @ApiOkResponse({ type: PipelineResponseDto })
  archive(@Param('id') id: string) {
    return this.service.archive(+id);
  }
  @Post(':id/stages')
  @ApiOperation({ summary: 'Add a custom stage' })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  @ApiCreatedResponse({ type: PipelineStageResponseDto })
  add(@Param('id') id: string, @Body() d: CreateStageDto) {
    return this.service.addStage(+id, d);
  }
  @Put(':id/stages/order')
  @ApiOperation({ summary: 'Reorder all pipeline stages' })
  @ApiBadRequestResponse({ description: 'Incomplete or invalid ordering' })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  @ApiOkResponse({ type: PipelineResponseDto })
  order(@Param('id') id: string, @Body() d: ReorderStagesDto) {
    return this.service.reorder(+id, d);
  }
  @Delete(':id/stages/:stageId')
  @ApiOperation({ summary: 'Archive a stage without deleting history' })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  @ApiOkResponse({ type: PipelineStageResponseDto })
  archiveStage(@Param('id') id: string, @Param('stageId') s: string) {
    return this.service.archiveStage(+id, +s);
  }
  @Put(':id/stages/:stageId/transitions')
  @ApiOperation({ summary: 'Replace allowed outgoing transitions' })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  @ApiOkResponse({ type: [PipelineTransitionDto] })
  transitions(
    @Param('id') id: string,
    @Param('stageId') s: string,
    @Body() d: SetTransitionsDto,
  ) {
    return this.service.setTransitions(+id, +s, d);
  }
  @Patch(':id/stages/:stageId')
  @ApiOperation({ summary: 'Edit a stage on an unused pipeline revision' })
  @Permissions(CAPABILITIES.PIPELINES_CONFIGURE)
  @ApiOkResponse({ type: PipelineStageResponseDto })
  updateStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.service.updateStage(+id, +stageId, dto);
  }
}
