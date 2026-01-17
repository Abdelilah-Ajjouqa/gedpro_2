import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateStateDto } from './dto/update-candidate-state.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/auth.decorator';
import { Role } from '../users/enums/role.enum';
import { User } from '../users/entities/user.entity';

@Controller('candidates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CandidatesController {
    constructor(private readonly candidatesService: CandidatesService) { }

    @Post()
    @Roles(Role.RH, Role.ADMIN) // Only RH or Admin can create candidates manually
    create(@Body() createCandidateDto: CreateCandidateDto) {
        return this.candidatesService.create(createCandidateDto);
    }

    @Get()
    @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
    findAll() {
        return this.candidatesService.findAll();
    }

    @Get(':id')
    @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
    findOne(@Param('id') id: string) {
        return this.candidatesService.findOne(+id);
    }

    @Patch(':id/state')
    @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
    updateState(
        @Param('id') id: string,
        @Body() updateCandidateStateDto: UpdateCandidateStateDto,
        @Req() req: any
    ) {
        return this.candidatesService.updateState(
            +id,
            updateCandidateStateDto.state,
            req.user as User,
            updateCandidateStateDto.comment
        );
    }
}
