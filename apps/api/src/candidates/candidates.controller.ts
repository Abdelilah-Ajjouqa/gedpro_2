import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
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
@Roles(Role.RH, Role.ADMIN, Role.MANAGER)
export class CandidatesController {
  constructor(private service: CandidatesService) {}
  @Post()
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({ summary: 'Create a normalized candidate record' })
  @ApiConflictResponse({
    description: 'Normalized email or phone already exists',
  })
  create(@Body() d: CreateCandidateDto, @Req() r: any) {
    return this.service.create(d, r.user);
  }
  @Get() @ApiOperation({ summary: 'Search and filter active candidates' }) list(
    @Query() q: ListCandidatesDto,
    @Req() r: { user: User },
  ) {
    return this.service.findAll(q, r.user);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get an active candidate' })
  @ApiNotFoundResponse({ description: 'Candidate not found' })
  one(@Param('id') id: string, @Req() r: { user: User }) {
    return this.service.findOne(+id, false, r.user);
  }
  @Patch(':id')
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({
    summary:
      'Update candidate details, tags, skills, source, ownership, or consent',
  })
  update(
    @Param('id') id: string,
    @Body() d: UpdateCandidateDto,
    @Req() r: any,
  ) {
    return this.service.update(+id, d, r.user);
  }
  @Post(':id/archive')
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({ summary: 'Archive a candidate' })
  archive(@Param('id') id: string, @Req() r: any) {
    return this.service.archive(+id, r.user);
  }
  @Post(':id/restore')
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({ summary: 'Restore an archived candidate' })
  restore(@Param('id') id: string, @Req() r: any) {
    return this.service.restore(+id, r.user);
  }
  @Get(':id/duplicates')
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({
    summary: 'Find candidates sharing normalized email or phone',
  })
  duplicates(@Param('id') id: string) {
    return this.service.duplicates(+id);
  }
  @Post(':id/merge')
  @Roles(Role.RH, Role.ADMIN)
  @ApiOperation({ summary: 'Merge a source candidate into this target' })
  @ApiConflictResponse({
    description: 'Both candidates applied for the same job',
  })
  merge(@Param('id') id: string, @Body() d: MergeCandidatesDto, @Req() r: any) {
    return this.service.merge(+id, d.sourceCandidateId, r.user);
  }
  @Get(':id/privacy/export')
  @Roles(Role.ADMIN, Role.RH)
  @ApiOperation({ summary: 'Export candidate personal and recruitment data' })
  export(@Param('id') id: string, @Req() r: any) {
    return this.service.exportData(+id, r.user);
  }
  @Post(':id/privacy/deletion-request')
  @Roles(Role.ADMIN, Role.RH)
  @ApiOperation({ summary: 'Record an audited personal-data deletion request' })
  requestDeletion(@Param('id') id: string, @Req() r: any) {
    return this.service.requestDeletion(+id, r.user);
  }
  @Post(':id/privacy/erase')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Anonymize candidate personal data while preserving recruitment history',
  })
  erase(@Param('id') id: string, @Req() r: any) {
    return this.service.erase(+id, r.user);
  }
  @Patch(':id/state')
  @ApiOperation({ summary: 'Change the legacy candidate lifecycle state' })
  state(
    @Param('id') id: string,
    @Body() d: UpdateCandidateStateDto,
    @Req() r: any,
  ) {
    return this.service.updateState(+id, d.state, r.user as User, d.comment);
  }
}
