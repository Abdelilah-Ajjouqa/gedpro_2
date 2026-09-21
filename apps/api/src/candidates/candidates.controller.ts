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
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { CAPABILITIES } from '../auth/authorization.service';
import { parseRequiredEtag, quoteEtag } from '../common/http/etag';
import type { Response } from 'express';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  CandidateDetailDto,
  CandidateDuplicateDto,
  CandidateListResponseDto,
} from './dto/candidate-response.dto';
import { CandidatesService } from './candidates.service';
import {
  CreateCandidateDto,
  ListCandidatesDto,
  MergeCandidatesDto,
  UpdateCandidateDto,
} from './dto/create-candidate.dto';
import { UpdateCandidateStateDto } from './dto/update-candidate-state.dto';
@ApiTags('Candidates')
@ApiProtected()
@Controller('candidates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CandidatesController {
  constructor(private service: CandidatesService) {}
  @Post()
  @Permissions(CAPABILITIES.CANDIDATES_CREATE)
  @ApiCreatedResponse({ type: CandidateDetailDto })
  @ApiOperation({ summary: 'Create a normalized candidate record' })
  @ApiConflictResponse({
    description: 'Normalized email or phone already exists',
  })
  create(@Body() d: CreateCandidateDto, @Req() r: any) {
    return this.service.create(d, r.user);
  }
  @Get()
  @ApiOperation({ summary: 'Search and filter candidates' })
  @ApiOkResponse({ type: CandidateListResponseDto })
  @Permissions(CAPABILITIES.CANDIDATES_READ)
  list(@Query() q: ListCandidatesDto, @Req() r: { user: User }) {
    return this.service.findAll(q, r.user);
  }
  @Get(':id')
  @ApiOkResponse({ type: CandidateDetailDto })
  @ApiOperation({ summary: 'Get an active candidate' })
  @ApiNotFoundResponse({ description: 'Candidate not found' })
  @Permissions(CAPABILITIES.CANDIDATES_READ)
  async one(
    @Param('id') id: string,
    @Req() r: { user: User },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.findOne(+id, true, r.user);
    response.setHeader('ETag', quoteEtag(result.version));
    return result;
  }
  @Patch(':id')
  @ApiOkResponse({ type: CandidateDetailDto })
  @Permissions(CAPABILITIES.CANDIDATES_UPDATE)
  @ApiOperation({
    summary:
      'Update candidate details, tags, skills, source, ownership, or consent',
  })
  update(
    @Param('id') id: string,
    @Body() d: UpdateCandidateDto,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.update(+id, d, r.user, parseRequiredEtag(etag));
  }
  @Post(':id/archive')
  @HttpCode(200)
  @ApiOkResponse({ type: CandidateDetailDto })
  @Permissions(CAPABILITIES.CANDIDATES_ARCHIVE)
  @ApiOperation({ summary: 'Archive a candidate' })
  archive(
    @Param('id') id: string,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.archive(+id, r.user, parseRequiredEtag(etag));
  }
  @Post(':id/restore')
  @HttpCode(200)
  @ApiOkResponse({ type: CandidateDetailDto })
  @Permissions(CAPABILITIES.CANDIDATES_RESTORE)
  @ApiOperation({ summary: 'Restore an archived candidate' })
  restore(
    @Param('id') id: string,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.restore(+id, r.user, parseRequiredEtag(etag));
  }
  @Get(':id/duplicates')
  @ApiOkResponse({ type: [CandidateDuplicateDto] })
  @Permissions(CAPABILITIES.CANDIDATES_DUPLICATES_READ)
  @ApiOperation({
    summary: 'Find candidates sharing normalized email or phone',
  })
  duplicates(@Param('id') id: string) {
    return this.service.duplicates(+id);
  }
  @Post(':id/merge')
  @HttpCode(200)
  @ApiOkResponse({ type: CandidateDetailDto })
  @Permissions(CAPABILITIES.CANDIDATES_MERGE)
  @ApiOperation({ summary: 'Merge a source candidate into this target' })
  @ApiConflictResponse({
    description: 'Both candidates applied for the same job',
  })
  merge(
    @Param('id') id: string,
    @Body() d: MergeCandidatesDto,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.merge(
      +id,
      d.sourceCandidateId,
      r.user,
      parseRequiredEtag(etag),
    );
  }
  @Post(':id/privacy/export')
  @HttpCode(200)
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  @Permissions(CAPABILITIES.CANDIDATES_PRIVACY_EXPORT)
  @ApiOperation({ summary: 'Export candidate personal and recruitment data' })
  export(@Param('id') id: string, @Req() r: any) {
    return this.service.exportData(+id, r.user);
  }
  @Post(':id/privacy/deletion-request')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        requestedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Permissions(CAPABILITIES.CANDIDATES_PRIVACY_REQUEST_DELETION)
  @ApiOperation({ summary: 'Record an audited personal-data deletion request' })
  requestDeletion(
    @Param('id') id: string,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.requestDeletion(+id, r.user, parseRequiredEtag(etag));
  }
  @Post(':id/privacy/erase')
  @HttpCode(200)
  @ApiOkResponse({ type: CandidateDetailDto })
  @Permissions(CAPABILITIES.CANDIDATES_PRIVACY_ERASE)
  @ApiOperation({
    summary:
      'Anonymize candidate personal data while preserving recruitment history',
  })
  erase(
    @Param('id') id: string,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.erase(+id, r.user, parseRequiredEtag(etag));
  }
  @Patch(':id/state')
  @ApiOkResponse({ type: CandidateDetailDto })
  @Permissions(CAPABILITIES.CANDIDATES_STATE)
  @ApiOperation({ summary: 'Change the legacy candidate lifecycle state' })
  state(
    @Param('id') id: string,
    @Body() d: UpdateCandidateStateDto,
    @Req() r: any,
    @Headers('if-match') etag?: string,
  ) {
    return this.service.updateState(
      +id,
      d.state,
      r.user as User,
      d.comment,
      parseRequiredEtag(etag),
    );
  }
}
